class Player {
	constructor() {
		this.day = 1;

		this.foodRation = 1; //Amount of food eaten by one person in a day

		this.karma = 50;

		this.campPos = { x: undefined, y: undefined };//defined in openMap()
		this.currentPanel = 'default'; // left panel currently opened. modified in: changePanel()

		this.peopleIdCounter = 0;
		this.siteIdCounter = 0;

		this.farmProductionMultiplier = 1;

		/* this.unlockedBuildings = [
				'house', 
		]; */

	}
	getPop() {
		let campP = camp.people.getTotalMembers() + scavenging.getTotalScavengers();
		return campP;
	}
	getTotalSick() {
		// i'm quite proud of that line, tbh. very ES6
		return camp.people.members.reduce((total, person) => total += person.sick ? 1 : 0, 0);
	}
	getTotalWorking() {
		return camp.buildingCounter.count.reduce((t, countObj) => t += countObj.working, 0) + scavenging.getTotalScavengers();
	}
}
/* compressed for storage */
class StoredTileData {
	constructor(typeIndex, discovered, resourceLevel) {
		this.t = typeIndex;
		this.d = discovered;
		this.r = resourceLevel;
	}
}
/* actual tile data that goes in map.layout */
class TileData {
	constructor(typeIndex, id, discovered, resourceLevel) {
		this.typeIndex = typeIndex;
		this.id = id;
		this.discovered = discovered;
		this.type = map.layoutTiles[typeIndex].type;
		this.resourceLevel = resourceLevel;

		/* DEFINE TYPE DEPENDENT VARIABLES */
		this.setTypeDependentVariables();
	}
	looseResource(multiplier = 1) {
		this.resourceLevel = Math.round(this.resourceLevel - this.resourceDecay * multiplier);
		if (this.resourceLevel < 0) {
			this.resourceLevel = 0;
		}

		this.updateImage();
	}
	updateImage() {
		if (this.type == 'forest') {
			let empty = 'img/forest/empty.png',
				low = 'img/forest/low_density.png',
				mid = 'img/forest/mid_density.png';
			let tile = document.getElementById(this.id);
			if (this.resourceLevel <= 0 && tile.src != empty) {
				tile.src = empty;
			} else if (this.resourceLevel < 350 && tile.src != low) {
				tile.src = low;
			} else if (this.resourceLevel < 650 && tile.src != mid) {
				tile.src = mid;
			}
		}
	}
	generateLootPool() {
		if (this.resourceLevel == 0) {
			/* return empty if there is nothing left to scavenge */
			return 'empty';
		} else {
			let self = this;
			let lootPool;

			/* DEFINE LOOTPOOLS ACCORDING TO TYPE */

			switch (this.type) {
				case 'forest':
					lootPool = new LootPool(
						new LootPoolItem('wood', f(6), f(11), 5),
						new LootPoolItem('food', f(1), f(4), 2)
					);
					break;
				case 'factory':
					/* (concrete+, metal++, electronics+, ammo) */
					lootPool = new LootPool(
						new LootPoolItem('metal', f(2), f(5), 3),
						new LootPoolItem('concrete', f(3), f(6), 2),
						new LootPoolItem('electronics', f(1), f(5), 2),
						new LootPoolItem('ammo', f(1), f(3), 1)
					);
					break;
				case 'city_l':
					/* (drugs++, ammo+, electronics++, food++) */
					lootPool = new LootPool(
						new LootPoolItem('electronics', f(3), f(15), 2),
						new LootPoolItem('drugs', f(2), f(4), 2),
						new LootPoolItem('food', f(9), f(20), 4),
						new LootPoolItem('ammo', f(8), f(15), 3),
						new LootPoolItem('metal', f(1), f(4), 1)
					)
					break;
				case 'city_m':
					/* (drugs+, ammo, electronics+, cloth+, food+) */
					lootPool = new LootPool(
						new LootPoolItem('drugs', f(1), f(3), 2),
						new LootPoolItem('ammo', f(3), f(6), 1),
						new LootPoolItem('electronics', f(2), f(9), 3),
						new LootPoolItem('cloth', f(3), f(12), 2),
						new LootPoolItem('food', f(4), f(8), 4)
					);
					break;
				case 'city_s':
					lootPool = new LootPool(
						new LootPoolItem('drugs', f(1), f(2), 2),
						new LootPoolItem('ammo', f(4), f(8), 3),
						new LootPoolItem('electronics', f(2), f(4), 1),
						new LootPoolItem('cloth', f(3), f(10), 4),
						new LootPoolItem('food', f(4), f(8), 3),
						new LootPoolItem('concrete', f(5), f(8), 3),
						new LootPoolItem('metal', f(1), f(3), 2),
					);
					break;
				case 'plain':
					/* (wood-, ammo-, food [wild animals, wild plants]) */
					lootPool = new LootPool(
						new LootPoolItem('wood', f(2), f(4), 2),
						new LootPoolItem('ammo', f(1), f(2), 1),
						new LootPoolItem('food', f(1), f(4), 3),
						new LootPoolItem('fuel', f(1), f(1), 1)
					);
					break;

			}

			/* END DEFINITION */

			return lootPool;

			function f(n) {//reduces loot output as resourceLevel goes down
				let m = self.resourceLevel / 1000; // multiplier
				let r = Math.round(n * m);
				if (r <= 0) {
					r = 1;
				}
				return r;
			}
		}
	}
	setTypeDependentVariables() {
		switch (this.type) {
			case 'forest':
				this.resourceDecay = 15;
				this.lootDiversity = 2;
				break;
			case 'factory':
				this.resourceDecay = 25;
				this.lootDiversity = 3;
				break;
			case 'plain':
				this.resourceDecay = 125;
				this.lootDiversity = 1;
				break;
			case 'city_s':
				this.resourceDecay = 15;
				this.lootDiversity = 3;
				break;
			case 'city_m':
				this.resourceDecay = 10;
				this.lootDiversity = 4;
				break;
			case 'city_l':
				this.resourceDecay = 5;
				this.lootDiversity = 5;
				break;
			default:
				this.resourceDecay = 0;
		}
	}
	ct() { changeTile(this.id, editor.currentElemMap) }


}

class Vehicle {
	constructor(specs) {
		this.type = specs.type;
		this.speed = specs.speed;//tile/h
		this.carry = specs.carry;
		this.unitsPerFuelLoss = specs.unitsPerFuelLoss;
		this.fuelLoss = specs.fuelLoss;
		this.moveCounter = 0;
		this.seats = specs.seats;
		this.iconsrc = specs.iconsrc;
	}
}

class Party {
	constructor(gn, site = camp) {
		this.inMission = false;
		this.people = new PeopleGroup();
		this.status = undefined; //0: going to, 1: at, 2: coming back
		this.inventory = new Inventory();
		this.vehicle = vehicles.small_car;
		this.time = 0; //Action points
		this.pos = { x: site.pos.x, y: site.pos.y };
		this.gn = gn;
		this.icon;
	}
	move(x, y) {
		let distance = manhattanDistance(this.pos.x, this.pos.y, x, y);
		let timeCost = Math.floor(distance / this.vehicle.speed);
		this.pos = { x: x, y: y };
		this.time -= timeCost;
		this.vehicle.moveCounter += distance;
		/* update fuel in inventory */
		if (this.vehicle.moveCounter == this.vehicle.unitsPerFuelLoss) {
			this.inventory.fuel -= this.vehicle.fuelLoss;
			this.vehicle.moveCounter = 0;
			let distanceToCamp = manhattanDistance(this.pos.x, this.pos.y, player.campPos.x, player.campPos.y);
			let lowFuelMark = this.vehicle.fuelLoss * (distanceToCamp + 10) / this.vehicle.unitsPerFuelLoss;
			let noReturnMark = this.vehicle.fuelLoss * distanceToCamp / this.vehicle.unitsPerFuelLoss;
			let fuelDisplay = document.getElementById(g('dGroupFuel', this.gn));
			if (this.inventory.fuel <= 0) {/* NO MORE FUEL */
				this.inventory.fuel = 0;
				this.setNotif(`You have no fuel left.`, 'red');
				fuelDisplay.style.color = 'red';
			} else if (this.inventory.fuel < noReturnMark) {/* NOT ENOUGH FUEL TO GO BACK TO CAMP */
				this.setNotif(`You don't have enough fuel to come back !`, 'orange');
				fuelDisplay.style.color = 'orange';
			} else if (this.inventory.fuel <= lowFuelMark) {/* LOW FUEL */
				this.setNotif(`You barely have enough fuel to come back !`, 'yellow');
				fuelDisplay.style.color = 'yellow';
			}
		}
		updateGroupMovementMap(this.gn);
		moveElementOnTileMap(document.getElementById(g('partyIcon', this.gn)), `map${x}_${y}`);
		updateGroupOptions(this.gn);
		updateGroupInfo();
	}
	createIcon() {
		let icon = document.createElement('img');
		let self = this;
		icon.setAttribute('id', g('partyIcon', self.gn))
		icon.setAttribute('class', 'map_unit_icon');
		icon.setAttribute('src', self.vehicle.iconsrc);
		icon.setAttribute('alt', g('Group ', self.gn));
		icon.addEventListener('click', function () { changePanel('groups') });
		document.getElementById('map').appendChild(icon);
		self.icon = icon;
	}
	getMissionStatusStr() {
		if (this.status != undefined) {
			const str = ['going to', 'in the', 'coming back from'];
			let destName = 'destName';
			return str[this.status] + ' the ' + destName;
		} else {
			console.log('status is undefined. (party.getMissionStatus)');
			return 'lost';
		}
	}
	setNotif(message, color = 'white') {
		let notif = document.getElementById(g('dPartyNotif', this.gn));
		notif.innerHTML = message;
		notif.style.color = color;
	}
	reset() {
		this.inMission = false;
		this.status = undefined;
		this.members = 0;
		this.pos = player.campPos;
		let self = this;
		Object.getOwnPropertyNames(this.inventory).forEach(function (property) {
			self.inventory[property] = 0;
		});
		document.getElementById('resourceInputs' + this.gn).classList.remove('hidden');
		document.getElementById('inventory' + this.gn).classList.add('hidden');
		['food', 'ammo', 'fuel'].forEach((n) => {
			let input = document.getElementById('n' + firstLetterToUpperCase(n) + this.gn);
			input.classList.remove('hidden');
		});
		this.icon.parentElement.removeChild(this.icon);
	}
	transferInventoryToCamp() {
		let self = this;
		Object.getOwnPropertyNames(this.inventory).forEach(function (property) {
			camp.resources.addResource(property, self.inventory[property]);
			self.inventory[property] = 0;
		});
	}
	addResource(name, qty) {
		if (this.inventory.getSum() + qty > this.vehicle.carry) {
			/* display message to indicate lack of space */
			console.log('not enough space !');
		} else if (!isNaN(qty)) {
			this.inventory[name] += qty;
		}
	}
	checkNPCCollision() {
		NPCs.forAllUnits((unit) => {
			if (unit.x == this.pos.x && unit.y == this.pos.y) {
				console.log({ coll_party: this, coll_unit: unit });
			}
		});
	}
	createNPCInteractionOptions(NPC) {
		let options = document.getElementById('NPCInteractionOptions');
		options.innerHTML = '';
		let party = this;
		/* 
				HORDE
		*/
		if (NPC.data instanceof Horde) {
			/* if (party.time >= 1) {
				createOption('Attack', () => attack(NPC));
			} */
			if (party.time >= 3) {
				createOption('Gather info (3h)', () => gatherInfo(NPC));
			}
			createOption('Lure in another direction', () => { });
		}
		/* 
				SURVIVOR
		*/
		else if (NPC.data instanceof Survivor) {
			if (party.time >= 1) {
				createOption('Attack', () => attack(NPC));
			}
			if (party.time >= 3) {
				createOption('Gather info (3h)', () => gatherInfo(NPC));
			}
		} else {
			console.error(new Error('invalid data type.'));
		}
		changePanel('NPCInteraction');
		this.updateNPCInteraction(NPC);

		function gatherInfo(NPC) {
			if (getDistance(party.pos.x, party.pos.y, NPC.x, NPC.y) > 1) {
				party.setNPCNotif('We are too far.', 'red');
			} else {
				party.time -= 3;
				party.gatherInfo(NPC);
			}
		}

		function attack(NPC) {

			if (getDistance(party.pos.x, party.pos.y, NPC.x, NPC.y) > 1) {
				party.setNPCNotif('We are too far.', 'red');
			} else {
				party.time -= 3;
				party.attack(NPC);
			}
		}

		function createOption(value, handler) {
			createButton(value, options, handler);
		}
	}
	updateNPCInteraction(NPC) {
		let time = document.getElementById('NPCInteractionPartyTime');
		time.innerHTML = this.time;

		/* NPCInteraction unit informations display */
		if (NPC != undefined) {
			/* display values if discovered and ? if not */
			if (NPC.data.type == 'horde') {
				let display = document.getElementById('hordeSize');
				if (!NPC.data.playerDiscovered.size) {
					display.innerHTML = '???';
					display.style.color = 'white';
				} else {
					let hordeSize = NPC.data.getSizeStr();
					display.innerHTML = hordeSize.size;
					display.style.color = hordeSize.color;
				}
			} else if (NPC.data.type == 'survivor') {
				let dSize = document.getElementById('survivorSize');
				let dEquipment = document.getElementById('survivorEquipment');
				let dType = document.getElementById('survivorType');

				['size', 'equipment', 'type'].forEach((n) => {
					if (n == 'size') {
						if (!NPC.data.playerDiscovered.size) {
							dSize.innerHTML = '???';
							dSize.style.color = 'white';
						} else {
							let estimate = NPC.data.playerDiscovered.sizeEstimate;
							dSize.innerHTML = `${estimate[0]} - ${estimate[1]} members`;
						}
					} else if (n == 'equipment') {
						if (!NPC.data.playerDiscovered.equipment) {
							dEquipment.innerHTML = '?';
							dEquipment.style.color = 'white';
						} else {
							let equipStr = NPC.data.getEquipStr();
							dEquipment.innerHTML = equipStr.str;
							dEquipment.style.color = equipStr.color;
						}
					} else if (n == 'type') {
						if (!NPC.data.playerDiscovered.type) {
							dType.innerHTML = '?';
							dType.style.color = 'white';
						} else {
							let typeStr = NPC.data.getTypeStr();
							dType.innerHTML = typeStr.str;
							dType.style.color = typeStr.color;
						}
					}
				});
			} else { console.error(new Error('invalid target data type.')); }
		}
	}
	attack(target) {
		if (target instanceof NPC) {
			/* VS HORDE */
			if (target.data instanceof Horde) {
				this.pos = { x: target.x, y: target.y };
				moveElementOnTileMap(document.getElementById(g('partyIcon', this.gn)), `map${target.x}_${target.y}`);
				updateGroupMovementMap(this.gn);
				target.move(Math.sign(rand(-50, 50)), Math.sign(rand(-50, 50)));
			}
			/* VS SURVIVOR */
			else if (target.data instanceof Survivor) {
				/* move to enemy position */
				this.pos = { x: target.x, y: target.y };
				moveElementOnTileMap(document.getElementById(g('partyIcon', this.gn)), `map${target.x}_${target.y}`);
				updateGroupMovementMap(this.gn);
				target.move(Math.sign(rand(-50, 50)) + target.x, Math.sign(rand(-50, 50)) + target.y);

				/* Ammo calculation */
				let ammoLoss = rand(target.data.members, target.data.members * 5);
				if (ammoLoss >= this.inventory.ammo) {
					this.inventory.ammo = 0;
				} else {
					this.inventory.ammo -= ammoLoss;
				}

				/* outcome calculation */
				let difficulty = (target.data.members * target.data.equipment) / this.people.getTotalMembers() * 100;
				let outcome = rand(0, 100) + difficulty;

				/* Get rekt */
				if (outcome > 75) {
					let losses = rand(1, this.members);
					console.log()
					let enemyLosses = rand(1, target.members / 2);
					this.setNPCNotif(losses + ' members of the group died in the assault. We killed ' + enemyLosses + ' of them.', 'red');

					this.members -= losses;
					target.members -= enemyLosses;

					target.blink('red', 200);
				}
				/* Kill em all */
				else if (outcome > 40) {
					let lp = new LootPool(
						new LootPoolItem('fuel', 1, 2, 2),
						new LootPoolItem('ammo', 2, 6, 3),
						new LootPoolItem('metal', 2, 3, 1),
						new LootPoolItem('food', 3, 12, 5),
						new LootPoolItem('wood', 4, 7, 3)
					);

					let loot = lp.randomizeLoot(2, 4);
					loot.applyMultiplier(target.members);
					loot.addToInv(this.inventory);
					this.setNPCNotif('The group was able to kill all enemies. ' + generateResourceChangeList(loot));

					target.remove();
				}
				/* capture some */
				else {
					this.setNPCNotif('The group was able to capture some of the enemies.')

				}
				this.createNPCInteractionOptions(target);
			} else {
				console.error(new Error('invalid target data type.'));
			}
		} else {
			console.error(new Error('invalid target.'));
		}
		updateGroupInfo();
	}
	gatherInfo(target) {
		if (target instanceof NPC) {
			if (target.data instanceof Horde) {
				target.data.playerDiscovered.size = true;
				let display = document.getElementById('hordeSize');
				let hordeSize = target.data.getSizeStr();
				display.innerHTML = hordeSize.size;
				display.style.color = hordeSize.color;
				this.setNPCNotif('The group came back with information.');
			} else if (target.data instanceof Survivor) {
				let pool = ['size', 'equipment', 'type'];
				pool = pool.filter((el) => !target.data.playerDiscovered[el]);//remove already discovered elements from the pool
				let discoveries = discover(pool);
				discoveries.forEach((n) => {
					if (n == 'size') {
						target.data.playerDiscovered.size = true;
						let estimateGap = rand(1, Math.ceil(target.data.members / 10));
						let estimate = [target.data.members - estimateGap, target.data.members + estimateGap];
						if (estimate[0] <= 0) { estimate[0] = 1; }
						target.data.playerDiscovered.sizeEstimate = estimate;
					} else if (n == 'equipment') {
						target.data.playerDiscovered.equipment = true;
					} else if (n == 'type' && !target.data.playerDiscovered.type) {
						target.data.playerDiscovered.type = true;
					}
				});
				this.updateNPCInteraction(target);
				this.createNPCInteractionOptions(target);

				function discover(pool) {
					let diversity = rand(1, pool.length);
					let discoveries = [];
					for (let i = 0; i < diversity; i++) {
						let select = rand(0, pool.length - 1);
						discoveries.push(pool[select]);
						pool.splice(select, 1);
					}
					return discoveries;
				}
			} else {
				console.error(new Error('invalid target data type.'));
			}
		} else {
			console.error(new Error('invalid target.'));
		}
		updateGroupInfo();
	}
	setNPCNotif(str, color = 'white') {
		let message = document.getElementById('NPCInteractionMessage');
		message.innerHTML = str;
		message.style.color = color;
	}
	addPanelListeners() {
		let party = this;
		document.getElementById(g('bPartyPlus', this.gn)).addEventListener('click', function () {
			camp.people.transfer(1, party.people);
			updateGroupInfo();
		});
		document.getElementById(g('bPartyMinus', this.gn)).addEventListener('click', function () {
			party.people.transfer(1, camp.people);
			updateGroupInfo();
		});
		document.getElementById(g('bSendParty', this.gn)).addEventListener('click', function () { sendParty(party.gn) });

		['food', 'ammo', 'drugs', 'fuel'].forEach((name, undefined, arr) => {
			let input = document.getElementById(g('n' + firstLetterToUpperCase(name), party.gn));
			input.addEventListener('input', function () {
				let newValue = Number(input.value);
				if (isNaN(newValue)) {
					newValue = 0;
					input.value = 0;
				}
				input.value = eval(newValue);//gets rid of zero padding that might occur
				let max = party.vehicle.carry;
				/* get the total of other items already in the car */
				let totalOthers = arr.filter((n) => n != name).reduce((t, n) => { return t += party.inventory[firstLetterToLowerCase(n)]; }, 0);
				let newTotal = newValue + totalOthers;
				if (newTotal > max || newValue > camp.resources[name]) {
					input.style.color = 'red';
					input.value = party.inventory[firstLetterToLowerCase(name)];//Reset the value of the field
					setTimeout(function () { input.style.color = 'white' }, 500);
				} else {
					document.getElementById('groupTotalItems' + party.gn).innerHTML = newTotal;
					party.inventory[firstLetterToLowerCase(name)] = Number(input.value);
				}
			});
		});
	}
}

class Inventory {
	constructor() {
		this.food = 0;
		this.ammo = 0;
		this.drugs = 0;
		this.fuel = 0;
		this.electronics = 0;

		this.wood = 0;
		this.metal = 0;
		this.cloth = 0;
		this.concrete = 0;
	}
	getSum() {
		return Object.getOwnPropertyNames(this).reduce((t, n) => { return t += this[n] }, 0);
	}
	addResource(type, qty = 1) {
		if (type == undefined) {
			console.error(new Error('resource type is undefined.'));
		} else if (!Object.getOwnPropertyNames(this).includes(type)) {
			console.error(new Error('invalid resource type: ' + type + '.'));
		} else {
			endOfDayBuffer[type] += qty;
			this[type] += qty;
		}
	}
	forAll(callback) {
		Object.getOwnPropertyNames(this).forEach(callback);
	}
}

/* People simulation */

class Person {
	constructor() {
		this.id = `p_${player.peopleIdCounter}`;
		this.sick = false;
		this.sickTimeCounter = 0; // days
		this.hungryTimeCounter = 0;
		this.diseaseResistance = rand(6, 10); // days
		this.hunger = randNormal(75, 125); // out of 125;

		/* const names = ['John', 'Betty', 'Paul', 'Thomas', 'Jeanette', 'Andy', 'Howard', 'Allistair'],
				surnames = ['McAdams', 'Smith', 'Paulson', 'Jefferson', 'Braun'];
		this.name = names[rand(0, names.length - 1)];
		this.surname = surnames[rand(0, surnames.length - 1)]; */

		player.peopleIdCounter++;
	}
	hungerLoss() {
		this.hunger -= 25;
	}
	eat(ration, inventory) {
		if (inventory.food > 0) {
			this.hunger += ration * 25;
			if (this.hunger > 125) { this.hunger = 125; }
			inventory.food -= ration;
		}
	}
	getSickMaybe() {
		let sicknessProbability = mapIntervals(this.hunger, [0, 125], [60, 5]);
		let test = rand(0, 1000);
		if (test < sicknessProbability) {
			this.sick = true; /* get sick */
			this.sickTimeCounter = 0; /* reset counter */
		}
		//console.log({proba: sicknessProbability, test: test, per: this});
	}
}

class PeopleGroup { // container for people, eases transfers and other group gestion
	constructor() {
		this.members = [];
	}
	getTotalMembers() {
		return this.members.length;
	}
	addPeople(...people) {
		people.forEach((per) => { this.members.push(per); });
	}
	deathQty(qty = 1) {
		for (let i = 0; i < qty; i++) {
			this.members.splice(rand(0, this.members.length - 1), 1);
		}
	}
	deathId(id) {
		this.members.splice(this.getIndexById(id), 1);
	}
	transfer(qty, targetGroup) { // transfer people from this group to a target group
		if (!(targetGroup instanceof PeopleGroup)) {
			console.error(new Error('target group must be an instance of PeopleGroup.'));
		} else {
			for (let i = 0; i < qty; i++) {
				let temp = this.members.splice(rand(0, this.members.length - 1), 1);
				targetGroup.addPeople(temp[0]);
			}
		}
	}
	getIndexById(id) {
		this.members.forEach((per, i) => {
			if (per.id == id) return i;
		});
	}

}

class Site {
	constructor(x, y, name) {
		this.name = name;
		this.id = `s_${player.siteIdCounter}`;
		this.pos = { x: x, y: y };
		this.maxPeople = 15;
		this.people = new PeopleGroup();
		this.resources = new Inventory();
		this.buildingCounter = new BuildingCounter();

		player.siteIdCounter++;
	}
	createParty() {
		scavenging.parties.push(new Party(scavenging.parties.length, this));
	}
}

/* Display controllers */

class SiteDisplayController {
	constructor() {
		this.container = document.getElementById('siteDetContainer');
		this.content = document.getElementById('siteDet');
		this.exitButton = document.getElementById('siteExitButton');
		this.title = document.getElementById('siteTitle');
		this.header = document.getElementById('siteHeader');
		this.panelContent = document.getElementById('siteContent');
		this.panelsBar = document.getElementById('sitePanelsBar');
		this.panelTabs = {
			build: document.getElementById('buildTab'),
			overview: document.getElementById('overviewTab'),
			garage: document.getElementById('garageTab'),
			scavenging: document.getElementById('scavengingTab'),
			research: document.getElementById('researchTab'),
		}
		this.panels = {
			build: document.getElementById('buildPanel'),
			overview: document.getElementById('overviewPanel'),
			garage: document.getElementById('garagePanel'),
			scavenging: document.getElementById('scavengingPanel'),
			research: document.getElementById('researchPanel'),
		}

		this.currentPanel = 'build';


		let self = this;

		Object.getOwnPropertyNames(this.panelTabs).forEach((tabName) => {
			let tab = self.panelTabs[tabName];
			tab.addEventListener('click', () => self.changePanel(tabName, self));
		});
	}
	setTitle(title) {
		this.title.innerHTML = title;
	}
	show() {
		this.container.classList.remove('hidden');
		this.updateSize();
	}
	hide() {
		this.container.classList.add('hidden');
	}
	isHidden() {
		return this.container.classList.contains('hidden');
	}
	changePanel(panelName, self = this) {
		self.currentPanel = panelName;
		closeOtherThan(panelName);
		openPanel(panelName);

		if (panelName == 'build') {
			build.updateButtons();
		}

		function openPanel(name) {
			self.panels[name].classList.remove('hidden')
			self.panelTabs[name].classList.add('sitePanelBarTab_clicked');
		}
		function closePanel(name) {
			self.panels[name].classList.add('hidden');
			self.panelTabs[name].classList.remove('sitePanelBarTab_clicked');
		}
		function closeOtherThan(name) {
			let names = ['overview', 'build', 'garage', 'scavenging', 'research'];
			names.filter((n) => n != name).forEach((n) => closePanel(n));
		}
	}
	updateSize() {
		let panel = document.getElementById('leftpanel');

		let width = window.innerWidth;
		let height = window.innerHeight;
		let panelWidth = panel.offsetWidth;
		this.container.style.width = width - panelWidth + 'px';
		this.content.style.width = (width - panelWidth - 40) + 'px';
		this.content.style.height = (height - 40) + 'px';

		let tabsH = this.panelTabs.build.offsetHeight;
		let containerH = this.content.offsetHeight;
		let headerH = this.header.offsetHeight;
		this.panelContent.style.top = tabsH + 'px';
		this.panelContent.style.height = containerH - (tabsH + headerH + 10) + 'px';
	}
}

class EventDisplayController {
	constructor() {
		this.container = document.getElementById('eventTotalContainer');
		this.messages = document.getElementById('eventMessages');
		this.options = document.getElementById('eventOptions');
		this.title = document.getElementById('eventTitle');
		this.bContinue = document.getElementById('bEventContinue')
	}
	show() {
		this.container.classList.remove('hidden');
		this.hideContinue();
	}
	hide() {
		this.container.classList.add('hidden');
		document.getElementById('bNextDay').classList.remove('hidden');
	}
	continue() {
		/* action when continue button is clicked */
		evtDet.hide();

	}
	hideContinue() {
		this.bContinue.classList.add('hidden');
	}
	showContinue() {
		this.bContinue.classList.remove('hidden');
	}
	setMessage(text, color = 'black') {
		this.messages.innerHTML = text;
		this.messages.style.color = color;
	}
	addOption(value, handler, disabled = false) {
		createButton(value, this.options, handler, disabled);
	}
	resetOptions() {
		while (this.options.lastChild) {
			this.options.removeChild(this.options.lastChild);
		}
	}
	endOption() {
		updateMetrics();
		this.resetOptions();
		this.showContinue();
	}

}

/* Looting system pools */

/* 
 * How to use the looting system:
 *  1. CREATE A LOOT POOL ITEM
 *      - create a loot pool item with: new LootPoolItem(<name>, <min>, <max>, <weight>);
 *      <name> - string - the name of the resource to loot
 *      <min>, <max> - number - minimal and maximal output for this ressource (ex. 10 to 30 food, 5 to 10 wood, etc)
 *      <weight> - number - likelihood to get this resource (higher is better)
 * 
 *  2. CREATE A LOOT POOL CONTAINING THOSE ITEMS
 *      - create a loot pool using: new LootPool(<item>, <item>, <item>, ...)
 *      put loot pool items as parameters
 * 
 *  3. RANDOMIZE SOME LOOT OUT OF THERE
 *      - randomize using: lootPool.randomizeLoot(<diversityMin>, <diversityMax>)
 *      <diversityMin>, <diversityMax> - number - minimum and maximum number of different resources that can be outputted.
 *      the function returns a Loot object.
 *      the Loot object contains LootItem objects that contain the name and quantity of the ressource outputted.
 */

class LootPoolItem {
	constructor(name, min = 1, max = 1, weight = 1) {
		if (!Object.getOwnPropertyNames(camp.resources).includes(name)) {
			console.error(new Error('name does not match any resource name.'))
		}
		this.n = name;
		this.min = min;
		this.max = max;
		this.w = weight
	}
}

class LootPool {
	constructor(...poolItems) {
		this.items = [];
		poolItems.forEach((pItem) => {
			this.items.push(pItem);
		});
	}

	/* returns instance of Loot */
	randomizeLoot(diversityMin = 1, diversityMax = (this.items.length - 1)) {
		let table = [], lootArray = [];
		this.items.forEach((pItem, pIndex) => {
			for (let i = 0; i < pItem.w; i++) {
				table.push(pIndex);
			}
		});
		/* pick n (diversity) different items in that pool and generate loot based on weight */
		let diversity = rand(diversityMin, diversityMax);

		for (let i = 0; i < diversity; i++) {
			let tableIndex = rand(0, table.length - 1);
			let itemType = table[tableIndex];
			let pItem = this.items[itemType];

			let quantity = rand(pItem.min, pItem.max);
			lootArray.push(new LootItem(pItem.n, quantity));
			table = table.filter((el) => el != itemType);//remove all references to that type of resource from table
		}
		return new Loot(lootArray);
	}
}

/* Objects that are returned by LootPool.randomizeLoot() */

class LootItem {
	constructor(name, qty) {
		this.name = name;
		this.qty = qty;
	}
	applyToInv(targetInventory) {
		targetInventory.addResource(this.name, this.qty);
	}
}

class Loot {
	constructor(lootItems) {
		if (!(lootItems instanceof Array)) {
			console.error(new Error('Loot constructor parameter must be an array of LootItem'));
		} else {
			this.items = lootItems;
		}
	}
	contains(resName) {
		let nameIsContained = 0;
		this.items.forEach((item, i) => {
			if (item.name == resName) { nameIsContained = i }
		});
		return nameIsContained;
	}
	addLoot(loot, pos = 'end') {
		if (pos != 'end' && pos != 'start') {
			console.error(new Error('invalid position parameter.'));
		} else {
			if (loot instanceof LootItem) {
				if (pos == 'start') {
					this.items.unshift(loot); // add at start of array
				} else {
					this.items.push(loot); // add to end of array
				}
			} else {
				console.error(new Error('loot parameter must be an instance of LootItem.'));
			}
		}
	}
	addToInv(targetInventory) {
		this.items.forEach((item) => item.applyToInv(targetInventory))
	}
	getQty(name) {
		let qty = 0;
		this.items.forEach((item) => {
			if (item.name == name) {
				qty += item.qty;
			}
		});
		return qty;
	}
	applyMultiplier(multiplier) {
		this.items.forEach((item, i, arr) => {
			item.qty = Math.round(item.qty * multiplier);
			if (item.qty == 0) {
				arr.splice(i, 1);//remove loot if 0 qty;
			}
		});
	}
}

/* end */

class MapColor {
	constructor() {
		this.elem = document.getElementById('map');
		this.originalColor = this.getCurrentColor();
		this.originalImage = this.getCurrentImage();
		this.clock;
	}
	getCurrentColor() {
		return window.getComputedStyle(this.elem).backgroundColor;
	}
	getCurrentImage() {
		return window.getComputedStyle(this.elem).backgroundImage;
	}
	blink(color, duration) {
		let beforeColor = this.getCurrentColor();
		this.change(color);
		setTimeout(() => this.change(beforeColor), duration);
	}
	change(color) {
		this.elem.style.backgroundColor = color;
	}
	wobble(cycles = 360, loop = false) {
		const hslRange = [0, 360];
		const iRange = [0, cycles];
		let i = 0;
		let self = this;
		window.requestAnimationFrame(step);

		function step() {
			self.change(`hsl(${mapIntervals(i, iRange, hslRange)}, 40%, 14%)`);

			if (i < cycles || loop) {
				i++;
				window.requestAnimationFrame(step);
			}
		}
	}
}