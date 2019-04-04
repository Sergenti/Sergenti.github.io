class Party {
	constructor(gn, site = camp) {
		this.unlocked = false;
		this.inMission = false;
		this.people = new PeopleGroup();
		this.status = undefined; //0: going to, 1: at, 2: coming back
		this.inventory = new Inventory();
		this.vehicle = vehicles.foot;
		this.time = 0; //Action points
		this.pos = { x: site.pos.x, y: site.pos.y };
		this.sendable = true;
		this.gn = gn;
		this.icon;
	}
	move(x, y) {
		const distance = manhattanDistance(this.pos.x, this.pos.y, x, y);
		const timeCost = Math.floor(distance / this.vehicle.speed);
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
			let fuelDisplay = document.getElementById(g('dGroupFuel'));
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
		this.updateMovementMap();
		const duration = distance * animationFramesPerTile; // frames
		moveElementOnTileMapSmooth(document.getElementById(g('partyIcon', this.gn)), `map${x}_${y}`, duration);
		this.updateInfo();
		this.updateOptions();
	}
	createIcon() {
		let icon = document.createElement('img');
		let self = this;
		icon.setAttribute('id', g('partyIcon', self.gn))
		icon.setAttribute('class', 'map_unit_icon');
		icon.setAttribute('src', self.vehicle.iconsrc);
		icon.setAttribute('alt', g('Group ', self.gn));
		icon.addEventListener('click', function () {
			self.openWindow(self);
		});
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
		let notif = document.getElementById('dPartyNotif');
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
		document.getElementById('resourceInputs').classList.remove('hidden');
		document.getElementById('groupInventory').classList.add('hidden');
		['food', 'ammo', 'fuel'].forEach((n) => {
			let input = document.getElementById('n' + firstLetterToUpperCase(n));
			input.classList.remove('hidden');
		});
		this.icon.parentElement.removeChild(this.icon);
	}
	send() {
		this.time = partiesTimeLimit;
		this.status = 1;
		this.inMission = true;
		this.pos = player.campPos;
		['food', 'ammo', 'drugs', 'fuel'].forEach((name) => {
			camp.resources[name] -= this.inventory[name];
			let input = document.getElementById('n' + firstLetterToUpperCase(name));
			input.value = 0;
		});
		//Show message when group sent
		let message = document.getElementById('dPartyNotif');
		message.innerHTML = 'The group is ready to receive orders.';
		message.style.color = 'white';
		/* create group icon */
		this.createIcon();
		this.updateInfo(); //also places group icon on camp position
		updateMetrics();
		//display options as of what to do with the group
		this.updateOptions();
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
			createOption('Lure in another direction (does nothing yet)', () => { });
		}
		/* 
				SURVIVOR
		*/
		else if (NPC.data instanceof Survivor) {
			if (party.time >= 1) {
				createOption('Attack', () => attack(NPC));
			}
			if (party.time >= 2 && NPC.data.status == 'unknown') {
				createOption('Contact', () => contact(NPC));
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
				party.setNPCNotif('We need to get closer fist.', 'orange');
			} else {
				party.time -= 3;
				party.gatherInfo(NPC);
			}
		}
		function attack(NPC) {
			if (getDistance(party.pos.x, party.pos.y, NPC.x, NPC.y) > 1) {
				party.setNPCNotif('We need to get closer fist.', 'orange');
			} else {
				party.time -= 3;
				party.attack(NPC);
			}
		}
		function contact(NPC) {
			if (getDistance(party.pos.x, party.pos.y, NPC.x, NPC.y) > 1) {
				party.setNPCNotif('We need to get closer fist.', 'orange');
			} else {
				party.time -= 3;
				party.contact(NPC);
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
				let dStatus = document.getElementById('survivorStatus');

				['size', 'equipment', 'status', 'type'].forEach((n) => {
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
					} else if (n == 'status') {
						let statusStr = NPC.data.getStatusStr();
						dStatus.innerHTML = statusStr.str;
						dStatus.style.color = statusStr.color;
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
				this.updateMovementMap();
				target.move(Math.sign(rand(-50, 50)), Math.sign(rand(-50, 50)));
			}
			/* VS SURVIVOR */
			else if (target.data instanceof Survivor) {
				/* move to enemy position */
				this.pos = { x: target.x, y: target.y };
				moveElementOnTileMap(document.getElementById(g('partyIcon', this.gn)), `map${target.x}_${target.y}`);
				this.updateMovementMap();
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
		this.updateInfo();
	}
	contact(target) {
		// compute the status of target
		const tendency = target.data.getTendency();
		const stat = (tendency.trade + tendency.assemble) / (tendency.fight * 2);
		//generate randomized input to determine the nature of the interaction with the player
		let randomized = 0;
		if (stat < 0.8) {
			randomized = randNormal(0, 100, 20);
		} else if (stat < 1.1) {
			randomized = randNormal(0, 100, 50);
		} else if (stat <= 1.4) {
			randomized = randNormal(0, 100, 80);
		} else {
			randomized = randNormal(0, 100, 95);
		}
		console.log(stat, randomized);
		//generate event
		if (randomized < 15) {
			target.data.status = 'hostile';
		}
	}
	trade(target) {
		let targetInventory = target.data.generateTradeInventory();
	}
	setNPCNotif(str, color = 'white') {
		let message = document.getElementById('NPCInteractionMessage');
		message.innerHTML = str;
		message.style.color = color;
	}
	updateInfo() {
		document.getElementById('groupWindowTitle').innerHTML = `Group ${this.gn + 1}`;
		document.getElementById('dAvPeople').innerHTML = camp.getAvailableWorkers();

		/* display available time and inventory only if party is in mission */
		let timeDiv = document.getElementById('partyTimeContainer');
		if (this.inMission && timeDiv.classList.contains('hidden')) {
			timeDiv.classList.remove('hidden');
		} else if (!this.inMission && !timeDiv.classList.contains('hidden')) {
			timeDiv.classList.add('hidden');
		}
		let inventory = document.getElementById('groupInventory');
		if (this.inMission && inventory.classList.contains('hidden')) {
			inventory.classList.remove('hidden');
		} else if (!this.inMission && !inventory.classList.contains('hidden')) {
			inventory.classList.add('hidden');
		}

		document.getElementById('groupTotalItems').innerHTML = this.inventory.getSum();
		document.getElementById('groupMaxItems').innerHTML = this.vehicle.carry;
		document.getElementById('dPartyMembers').innerHTML = this.people.getTotalMembers();
		let max = this.vehicle.seats;
		if (max == undefined) { max = 15; }
		document.getElementById('dPartyMaxMembers').innerHTML = max;
		document.getElementById('dPartyTime').innerHTML = this.time;

		/* update inventory values display */
		Object.getOwnPropertyNames(this.inventory).forEach((name) => document.getElementById('dGroup' + firstLetterToUpperCase(name)).innerHTML = this.inventory[name]);
		if (this.inMission) {
			this.updateOptions();
			this.updateIcon();
			document.getElementById('resourceInputs').classList.add('hidden');
			document.getElementById('groupInventory').classList.remove('hidden');
			if (this.time == 0) {
				this.setNotif(`There's nothing left to do here today.`, 'lightgrey');
			}
		} else {
			document.getElementById('resourceInputs').classList.remove('hidden');
			document.getElementById('groupInventory').classList.add('hidden');
		}
		//+/-/Send buttons
		let bPlus = document.getElementById('bPartyPlus');
		let bMinus = document.getElementById('bPartyMinus');
		let bSend = document.getElementById('bSendParty');
		//enable +
		if (this.people.getTotalMembers() < max && bPlus.disabled && !this.inMission) {
			bPlus.disabled = false;
		}
		//disable +
		if ((this.people.getTotalMembers() >= max || camp.people.getTotalMembers() == 0) && !bPlus.disabled || this.inMission) {
			bPlus.disabled = true;
		}
		//enable -
		if (this.people.getTotalMembers() > 0 && bMinus.disabled && !this.inMission) {
			bMinus.disabled = false;
		}
		//disable -
		if (this.people.getTotalMembers() <= 0 && !bMinus.disabled || this.inMission) {
			bMinus.disabled = true;
		}
		//enable send
		if (this.people.getTotalMembers() > 0 && bSend.disabled && this.sendable && !this.inMission) {
			bSend.disabled = false;
		}
		//disable send
		if ((this.people.getTotalMembers() <= 0 || this.inMission || !this.sendable) && !bSend.disabled) {
			bSend.disabled = true;
		}

		this.updateVignette();
	}
	updateOptions() {
		let party = this;
		let gn = this.gn;
		let currTile = map.layout[this.pos.y][this.pos.x];
		let type = currTile.type;
		this.resetOptions();
		/* MOVE */
		if (this.time > 0 && this.inventory.fuel > 0) {
			createGroupOption(gn, 'move', function () {
				party.toggleMovementMap();
			});
		}
		switch (type) {
			case 'camp':
				createGroupOption(gn, 'end mission', function () {
					party.setNotif('All scavenged equipment is safe in your camp. The scavengers went back to their family for the night.', 'lightgreen');
					party.transferInventoryToCamp();
					party.reset();
					/* disable sending this party until tomorrow */
					party.sendable = false
					TimerController.addTimer(() => {
						party.sendable = true;
					}, 1)
					updateMetrics();
					party.updateInfo();
					party.resetOptions();

					let overlay = document.querySelector('.overlaytile-green');
					if (overlay != null) { removeMovementMap(); }
				});
				break;
			case 'forest':
				/* scavenge, cut wood */
				break;
			case 'plain':
				/* scavenge */
				break;
			case 'factory':
				/* scavenge, bring back machine */
				//createGroupOption(gn, 'bring back machine', function () { });
				break;
			case 'gas_station':
				/* scavenge, look for cars
				(fuel++, food, cloth, metal, drugs) */
				break;
		}
		/* SCAVENGE */
		if (scavengeableTypes.includes(currTile.type) && this.time >= 3) {
			createGroupOption(gn, 'scavenge (3h)', scavenge);
		}
		/* NO MORE FUEL */
		if (this.inventory.fuel == 0 && this.vehicle.type != 'foot') {
			createGroupOption(gn, 'Abandon car', function () {
				party.resetOptions();
				party.setNotif(`Are you sure ? We won't be able to get it back later.`);

				createGroupOption(gn, 'yes', function () {
					party.vehicle = vehicles.foot;
					party.updateVignette();
					currTile.vehicleMemory.push(new TileVehicleMemory(party.vehicle, 100));
					party.setNotif('We got rid of the car.');
					party.updateInfo();
				});
				createGroupOption(gn, 'no', function () {
					party.setNotif('');
					party.updateInfo();
				});

			});
			createGroupOption(gn, 'Scavenge vicinity for fuel', function () {
				let isThereFuel = rand(0, 100);
				if (isThereFuel < player.karma) {
					let fuelLoot = randNormal(1, 3, 5);
					party.setNotif(`We were able to scavenge ${fuelLoot} fuel from nearby cars.<br> It won't get us far though.`, 'lightgreen');
					party.inventory.fuel += fuelLoot;
				} else {
					party.setNotif(`There is no fuel nearby.`, 'darkred');
				}
				party.updateInfo();
				party.updateOptions()
			});
		}
		/* case when the tile has an adjacent tile that's water */
		if (hasAdjacentTypeMap(currTile.id, 'water')) {
			if (party.time >= 1 && currTile.typeIndex != map.indexTable.camp) {
				createGroupOption(gn, 'Fish (1h)', function () {
					this.time -= 1;
					let success = rand(0, 100);
					let food = 0;
					let msg = `Group ${gn + 1} went fishing. `;
					if (success > 80) {
						food = rand(5, 7);
						msg += `They did very well !`;
					} else if (success > 50) {
						food = rand(3, 5);
						msg += `They did well !`;
					} else if (success > 25) {
						food = rand(1, 2);
						msg += `They found very few fish.`;
					} else {
						msg += `They found nothing !`;
					}
					msg += ` (+${food} Food)`;
					party.setNotif(msg);
					party.inventory.food += food;
					party.updateInfo();
					party.updateOptions();//display 'transfer loot' option if fishing on camp tile
				});
			}
		}

		function scavenge() {
			let loot = currTile.generateLootPool(); //generate loot based on tile
			if (loot == 'empty') {
				party.setNotif('There is nothing left to scavenge here.');
			} else {
				party.time -= 3;
				loot = loot.randomizeLoot(1, currTile.lootDiversity);
				loot.applyMultiplier(party.people.getTotalMembers());
				loot.addToInv(party.inventory);
				party.setNotif(generateResourceChangeList(loot));
				currTile.looseResource(party.people.getTotalMembers());
				party.updateInfo();
				party.updateOptions();
			}
		}
	}
	updateIcon() {
		let tileId = `map${this.pos.x}_${this.pos.y}`;
		moveElementOnTileMap(document.getElementById('partyIcon' + this.gn), tileId);
	}
	resetOptions() {
		let commands = document.getElementById('partyCommands');
		commands.innerHTML = '';
	}
	openWindow(self) {
		if (IGWindow.isHidden()) {
			if (scavenging.movingParty == self.gn) {
				removeMovementMap();
			}
			self.updateInfo();
			scavenging.selectedParty = self.gn;
			IGWindow.changeWindow('groups');
			IGWindow.show();
		} else {
			if (IGWindow.currentWindow == 'groups') {
				if (scavenging.selectedParty == self.gn) {
					IGWindow.hide();
				} else {
					scavenging.selectedParty = self.gn;
					self.updateInfo();
				}
			} else {
				scavenging.selectedParty = self.gn;
				self.updateInfo();
				IGWindow.changeWindow('groups');
			}
		}
	}
	updateVignette() {
		if (this.unlocked) {
			let vignette = Array.from(document.querySelectorAll('.groupVignette'))[this.gn];
			vignette.classList.remove('hidden');
			let icon = Array.from(document.querySelectorAll('.groupVignette > img'))[this.gn];
			icon.src = this.vehicle.iconsrc;
			let pop = document.getElementById(`groupVignettePop${this.gn}`);
			pop.innerHTML = this.people.getTotalMembers();
			let popMax = document.getElementById(`groupVignettePopMax${this.gn}`);
			let seats = this.vehicle.seats;
			popMax.innerHTML = seats == undefined ? 15 : seats;
		}
	}
	toggleMovementMap() {
		let greenFilters = document.querySelector('.overlaytile-green');
		if (greenFilters == null) {// There is no overlay
			this.createMovementMap();
			IGWindow.hide();
		} else {
			removeMovementMap();

		}
		this.updateOptions();
	}
	createMovementMap() {
		let party = this;
		let nOfTiles = 0;
		map.layout.forEach((lineData, y) => {
			lineData.forEach((tileData, x) => {
				let distanceToGroup = manhattanDistance(party.pos.x, party.pos.y, x, y);
				/* TO BE UPDATED WITH A PATHFINDING ALGORITHM THAT RETURNS ALL POSSIBLE TILES WE COULD GO TO*/
				if (distanceToGroup <= party.time * party.vehicle.speed && tileData.typeIndex != 'water') {
					/* if current tile is tile underneath the party and no other tile has been painted yet
						 -> we can only go on current tile, dont paint it. 
						 prevents game from displaying only the tile underneath party in case of 
						 remaining time < time to move */
					if (!(x == party.pos.x && y == party.pos.y && nOfTiles == 0)) {
						/* can go -> display green overlay*/
						let overlayTile = document.createElement('div');
						overlayTile.setAttribute('class', 'overlaytile-green');
						moveElementOnTileMap(overlayTile, tileData.id)
						let pos = getTileXYFromId(tileData.id);
						overlayTile.addEventListener('click', function () { party.move(pos.x, pos.y) });
						document.getElementById('map').appendChild(overlayTile);
						nOfTiles++;
					}
				}
			});
		});
		scavenging.movingParty = party.gn;
	}
	updateMovementMap() {
		removeMovementMap();
		if (this.time > 0) this.createMovementMap();
	}
}

function createGroupsVignettes() {
	scavenging.parties.forEach((party, gn) => {
		let container = document.getElementById('groupsVignetteContainer');
		let vignette = document.createElement('button');
		vignette.setAttribute('class', 'groupVignette hidden');
		vignette.addEventListener('click', () => {
			scrollToTile(party.pos.x, party.pos.y, 'smooth');
			party.openWindow(party)
		})

		let title = document.createElement('span');
		title.innerHTML = `Group ${gn + 1}`;
		title.classList.add('groupVignetteTitle');

		let icon = document.createElement('img');
		icon.setAttribute('src', party.vehicle.iconsrc);
		icon.setAttribute('alt', `Group ${gn + 1}`);

		let popContainer = document.createElement('div');
		popContainer.classList.add('groupVignettePopContainer')
		let popMax = document.createElement('span');
		popMax.setAttribute('id', `groupVignettePopMax${gn}`);
		popMax.innerHTML = party.vehicle.seats;
		let pop = document.createElement('span');
		pop.setAttribute('id', `groupVignettePop${gn}`);
		pop.innerHTML = party.people.getTotalMembers();

		popContainer.appendChild(pop);
		popContainer.insertAdjacentHTML('beforeend', '/');
		popContainer.appendChild(popMax);

		vignette.appendChild(icon);
		vignette.appendChild(title);
		vignette.appendChild(popContainer);

		container.appendChild(vignette);
	})
}
function updateGroupsVignettes() {
	scavenging.parties.forEach(party => {
		party.updateVignette();
	});
}
function addGroupsWindowListeners() {
	document.getElementById('bPartyPlus').addEventListener('click', groupButtonPlusClick);
	document.getElementById('bPartyMinus').addEventListener('click', groupButtonMinusClick);
	document.getElementById('bSendParty').addEventListener('click', groupButtonSendClick);

	['food', 'ammo', 'drugs', 'fuel'].forEach((name, undefined, arr) => {
		let input = document.getElementById('n' + firstLetterToUpperCase(name));
		input.addEventListener('input', function () {
			let party = scavenging.parties[scavenging.selectedParty];
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
				document.getElementById('groupTotalItems').innerHTML = newTotal;
				party.inventory[firstLetterToLowerCase(name)] = Number(input.value);
			}
		});
	});
}
function groupButtonPlusClick() {
	let party = scavenging.parties[scavenging.selectedParty];
	camp.people.transfer(1, party.people);
	party.updateInfo();
}
function groupButtonMinusClick() {
	let party = scavenging.parties[scavenging.selectedParty];
	party.people.transfer(1, camp.people);
	party.updateInfo();
}
function groupButtonSendClick() {
	let party = scavenging.parties[scavenging.selectedParty];
	party.send();
	party.updateInfo();
	scrollToTile(camp.pos.x, camp.pos.y, 'smooth');
}
function createGroupOption(groupNumber, value, handler) {
	let commandsDiv = document.getElementById('partyCommands');
	createButton(value, commandsDiv, handler);
}
function removeMovementMap() {
	let divs = document.querySelectorAll('.overlaytile-green');
	divs.forEach((div) => document.getElementById('map').removeChild(div));
	scavenging.movingParty = undefined;
}