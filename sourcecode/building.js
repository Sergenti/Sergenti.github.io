class BuildController {
	constructor() {

		this.indexTable = {
			house: 0,
			garden: 1,
			fence: 2,
			garage: 3,
		};

		this.buildings = [

			/* House */
			new Building({
				idName: 'house',
				name: 'House',
				resources: {
					wood: 150,
					metal: 15,
					concrete: 60,
					cloth: 5,
					electronics: 0,
				},
				text: 'Build a house to expand your settlement.',
				limit: false,
				workerCapacity: 0,
				onBuild: function () {
					camp.maxPeople += houseMaxPopIncrease;
					updateMetrics();
				}
			}),
			/* Garden */
			new Building({
				idName: 'garden',
				name: 'Garden',
				resources: {
					wood: 100,
					metal: 10,
					concrete: 50,
					cloth: 15,
					electronics: 0,
				},
				text: 'Produce your own food.',
				limit: false,
				workerCapacity: 5,
				onDayEnd: function (qty) {
					camp.resources.addResource('food', Math.round(5 * player.farmProductionMultiplier * camp.buildingCounter.getWorkers('garden') * qty));
					updateMetrics();
				}
			}),
			/* Fence */
			new Building({
				idName: 'fence',
				name: 'Fence',
				resources: {
					wood: 500,
					metal: 150,
					concrete: 200,
					cloth: 0,
					electronics: 0,
				},
				text: 'Keeps zombies out of your backyard.',
				limit: 1,
				onBuild: function () {

				}
			}),
			/* Garage */
			new Building({
				idName: 'garage',
				name: 'Garage',
				resources: {
					wood: 500,
					metal: 300,
					concrete: 500,
					cloth: 0,
					electronics: 0,
				},
				text: 'Allows you to send more groups to scavenge.',
				limit: 5,
				onBuild: function (garageQty) {
					if (garageQty == 1) {
						document.getElementById('garageTab').classList.remove('hidden');
						player.garageUnlocked = true;
					}
					for(let gn = 0; gn < scavenging.getMaxParties(); gn++){
						let party = scavenging.parties[gn];
						if(party.unlocked == false){
							party.unlocked = true;
							party.updateVignette();
							break;
						}
					}
				},
			}),
			/* Workshop (enables research) */
			new Building({
				idName: 'workshop',
				name: 'Workshop',
				resources: {
					wood: 1000,
					metal: 450,
					concrete: 500,
					cloth: 50,
					electronics: 200,
				},
				text: `It's expensive, and it allows you to spend more resources on research.`,
				limit: 1,
				onBuild: function () {
					document.getElementById('researchTab').classList.remove('hidden');
					player.researchUnlocked = true;
				},
			}),
			/* Windmill */
			new Building({
				idName: 'windmill',
				name: 'Windmill',
				resources: {
					wood: 300,
					metal: 45,
					concrete: 130,
					cloth: 200,
					electronics: 0,
				},
				text: 'Build a windmill to produce more food out of your crops.',
				limit: false,
				workerCapacity: 4,
				onBuild: function () {
					player.farmProductionMultiplier += 0.25;
				},
			}),
			/* Bullet factory */
			new Building({
				idName: 'bullet_factory',
				name: 'Bullet factory',
				resources: {
					wood: 300,
					metal: 100,
					concrete: 400,
					cloth: 10,
					electronics: 0,
				},
				text: 'Uses metal to produce ammo',
				limit: false,
				workerCapacity: 15,
				onDayEnd: function (qty) {
					if (camp.resources.metal > 0) {
						let metalConsumption = 1 * qty;
						let ammoProduction = 5 * qty;
						if (camp.resources.metal - metalConsumption < 0) {
							let ratio = metalConsumption / camp.resources.metal;
							ammoProduction = Math.round(ammoProduction * ratio);
							camp.resources.metal = 0;

						} else {
							camp.resources.addResource('metal', -metalConsumption);
						}
						camp.resources.addResource('ammo', ammoProduction);
					}
				}

			}),
		];
	}
	fillBuy() {
		this.buildings.forEach(b => b.createBuyButton());
	}
	fillDisplayers() {
		this.buildings.forEach(b => {
			if (b.workerCapacity > 0) {
				b.createDisplayer()
			}
		});
	}
	hasEnoughResources(building, inventory) {
		const resourceNames = ['wood', 'metal', 'concrete', 'cloth'];
		let under = [];

		resourceNames.forEach(n => {
			if (inventory[n] < building.resources[n]) {
				let o = {
					name: n,
					gap: building.resources[n] - inventory[n],
				};
				under.push(o);
			}
		});

		if (under.length == 0) {
			return true;
		} else {
			return under;
		}
	}
	build(building) {
		/* transaction */
		Object.getOwnPropertyNames(building.resources).forEach(n => {
			camp.resources.addResource(n, -building.resources[n]);
		});
		camp.buildingCounter.addBuilding(building.idName);
		
		/* trigger building onBuild method */
		if (building.onBuild != undefined) {
			building.onBuild(camp.buildingCounter.getByIdName(building.idName).qty);
		}
		/* hide button if limit reached */
		if (camp.buildingCounter.getQty(building.idName) == building.limit && building.limit != false) {
			document.getElementById(`${building.idName}_buyButton`).classList.add('hidden');
			document.querySelector(`#${building.idName}_buyButton + br`).remove();//remove the br next to the button
		}

		updateMetrics();
		this.updateButtons();
		this.updateDisplayers();
	}
	updateButtons() {
		const resourceNames = ['wood', 'metal', 'concrete', 'cloth', 'electronics'];

		this.buildings.forEach(building => {
			let button = document.getElementById(`${building.idName}_buyButton`);

			let buildingQty = camp.buildingCounter.getQty(building.idName);
			let qtyDisplay = document.getElementById(`${building.idName}_qty`);
			if(buildingQty > 0){
				if(qtyDisplay.classList.contains('hidden')){
					qtyDisplay.classList.remove('hidden');
				}
				qtyDisplay.innerHTML = ` (${buildingQty})`;
			}
			

			let resTest = this.hasEnoughResources(building, camp.resources)
			if (resTest == true) {
				if (button.disabled) {
					/* enable the button */
					button.disabled = false;
					/* change color of cost text to original */
					resourceNames.forEach(resName => {
						if(building.resources[resName] > 0){
							let resQtyDisplay = document.getElementById(`${building.idName}_${resName}_cost`);
							resQtyDisplay.style.removeProperty('color');
						}
					});
				}
			} else {
				/* disable the button */
				if (!button.disabled) button.disabled = true;
				/* change the color of cost text to red */
				resTest.forEach(obj => {
					let resQtyDisplay = document.getElementById(`${building.idName}_${obj.name}_cost`);
					resQtyDisplay.style.color = 'rgb(204, 63, 75)';
				});
			}
		});
	}
	updateDisplayers(){
		this.buildings.forEach(b => {
			if(b.workerCapacity > 0) b.updateDisplayer();
		});
	}
	getByIdName(idName) {
		let index = undefined;
		this.buildings.forEach((b, i) => { if (b.idName == idName) index = i });
		if (index == undefined) {
			console.error(new Error('Specified idName does not match any building.'));
			return undefined;
		} else {
			let building = this.buildings[index];
			return building;
		}
	}
}

class Building {
	constructor(parameters) {
		this.idName = parameters.idName;
		this.name = parameters.name;
		this.resources = parameters.resources;
		this.text = parameters.text;
		this.limit = parameters.limit;
		this.workerCapacity = parameters.workerCapacity;
		this.onBuild = parameters.onBuild; /* function that triggers when the building gets built */
		this.onDayEnd = parameters.onDayEnd;
	}

	createBuyButton() {
		const resourceNames = ['wood', 'metal', 'concrete', 'cloth', 'electronics'];
		let self = this;

		let button = document.createElement('button');
		button.setAttribute('class', 'buildingBuyButton');
		button.setAttribute('id', `${this.idName}_buyButton`)
		button.addEventListener('click', () => build.build(self));

		let title = document.createElement('div');
		title.setAttribute('class', 'buildingBuyTitle');
		title.innerHTML = this.name;
		let qty = document.createElement('span');
		qty.classList.add('hidden');
		qty.setAttribute('id', `${this.idName}_qty`);
		title.insertAdjacentElement('beforeend', qty);

		let cost = document.createElement('div');
		cost.setAttribute('class', 'buildingBuyCost');
		resourceNames.forEach(name => {
			if (this.resources[name] > 0) {
				let container = document.createElement('div');
				container.style.display = 'inline-block';
				container.style.margin = '2px';

				let icon = document.createElement('img');
				icon.setAttribute('src', `img/gui/resources/${name}.png`);
				icon.setAttribute('alt', name);
				icon.setAttribute('title', firstLetterToUpperCase(name));

				let qty = document.createElement('span');
				qty.setAttribute('id', `${this.idName}_${name}_cost`);
				qty.setAttribute('class', 'buildingBuyResourceCostQty');
				qty.innerHTML = this.resources[name];

				container.appendChild(icon);
				container.appendChild(qty);
				cost.appendChild(container);
			}
		});

		let text = document.createElement('div');
		text.setAttribute('class', 'buildingBuyText')
		text.innerHTML = this.text;

		button.appendChild(title);
		button.appendChild(text);
		button.appendChild(cost);

		let cont = document.getElementById('constructionContainer');

		cont.appendChild(button)
		cont.appendChild(document.createElement('br'));
	}
	createDisplayer() {
		let displayer = document.createElement('div');
		displayer.setAttribute('id', `${this.idName}_site_displayer`)
		displayer.setAttribute('class', 'buildingDisplayer');
		if(camp.buildingCounter.getByIdName(this.idName).qty == 0){
			displayer.classList.add('hidden');
		}

		let title = document.createElement('div');
		title.setAttribute('class', 'buildingDisTitle');
		title.innerHTML = this.name;

		let workDiv = document.createElement('div');
		let working = document.createElement('span');
		working.setAttribute('id', `${this.idName}_working`);
		let maxWorking = document.createElement('span');
		maxWorking.setAttribute('id', `${this.idName}_max_working`);

		workDiv.appendChild(working);
		workDiv.insertAdjacentHTML('beforeend', '/');
		workDiv.appendChild(maxWorking);

		let self = this;

		let buttonsContainer = document.createElement('div');
		buttonsContainer.setAttribute('class', 'buildDisplayerButtonsContainer');

		let bPlus = document.createElement('input');
		bPlus.setAttribute('type', 'button');
		bPlus.setAttribute('value', '+');
		bPlus.setAttribute('id', `${this.idName}_worker_plus`);
		bPlus.addEventListener('click', () => {
			camp.buildingCounter.addWorkers(self.idName, 1);
			self.updateDisplayer();
		});
		let bMinus= document.createElement('input');
		bMinus.setAttribute('type', 'button');
		bMinus.setAttribute('value', '-');
		bMinus.setAttribute('id', `${this.idName}_worker_minus`);
		bMinus.addEventListener('click', () => {
			camp.buildingCounter.addWorkers(self.idName, -1);
			self.updateDisplayer();
		});

		buttonsContainer.appendChild(bMinus);
		buttonsContainer.appendChild(bPlus);

		displayer.appendChild(title);
		displayer.appendChild(workDiv);
		displayer.appendChild(buttonsContainer);
		document.getElementById('buildingsContainer').appendChild(displayer);
		this.updateDisplayer();
		//console.log(displayer);
	}
	updateDisplayer() {
		if(this.workerCapacity > 0){
			let workers = camp.buildingCounter.getWorkers(this.idName);
			let totCap = this.workerCapacity * camp.buildingCounter.getQty(this.idName);

			let working = document.getElementById(`${this.idName}_working`);
			let maxWorking = document.getElementById(`${this.idName}_max_working`);
			working.innerHTML = workers;
			maxWorking.innerHTML = totCap;

			// +/- buttons
			let bPlus = document.getElementById(`${this.idName}_worker_plus`);
			let bMinus = document.getElementById(`${this.idName}_worker_minus`);

			if(workers >= totCap && bPlus.disabled == false){
				bPlus.disabled = true;
			} else if(workers < totCap && bPlus.disabled == true){
				bPlus.disabled = false;
			}
			if(workers <= 0 && bMinus.disabled == false){
				bMinus.disabled = true;
			} else if(workers > 0 && bMinus.disabled == true){
				bMinus.disabled = false;
			}
		} else {
			console.error(new Error(`${this.name} worker capacity is 0.`));
		}
	}
}

class BuildingCounter {
	constructor() {
		this.count = [];
		build.buildings.forEach(b => {
			this.count.push({
				idName: b.idName,
				qty: 0,
				workers: 0,
			});
		});
	}
	getByIdName(idName) {
		let index = 0;
		this.count.forEach((obj, i) => { if (obj.idName == idName) index = i });
		let countObj = this.count[index];
		return countObj;
	}
	getQty(idName) {
		let countObj = this.getByIdName(idName);
		return countObj.qty;
	}
	getWorkers(idName) {
		let countObj = this.getByIdName(idName);
		return countObj.workers
	}
	addBuilding(idName, qty = 1) {
		let countObj = this.getByIdName(idName);
		countObj.qty += qty;
	}
	addWorkers(idName, qty = 1) {
		let countObj = this.getByIdName(idName);
		countObj.workers += qty;
	}

}