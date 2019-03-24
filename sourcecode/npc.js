class NPC {
	constructor(name, id, index, type, position) {
		/* icon, data declared in other methods of this object*/
		this.id = id;
		this.index = index
		this.name = name;
		switch (type) {
			case 'horde':
				this.data = new Horde();
				this.originalColor = 'transparent'
				break;
			case 'survivor':
				this.data = new Survivor();
				this.originalColor = 'transparent'
				break;
			default:
				console.error(new Error('invalid type.'));
		}

		if (position == undefined) {
			this.x = rand(0, map.width - 1);
			this.y = rand(0, map.height - 1);
			while (map.layout[this.y][this.x].type == 'water') {
				this.x = rand(0, map.width - 1);
				this.y = rand(0, map.height - 1);
			}
		} else {
			this.x = position.x;
			this.y = position.y;
		}

	}
	move(x, y) {
		this.x = x;
		this.y = y;
		if (this.icon != null) {
			moveElementOnTileMap(this.icon, `map${x}_${y}`);
		} else {
			console.error(new Error('icon is null.'));
		}

	}
	createIcon() {
		let icon = document.createElement('img');
		icon.setAttribute('id', this.id);
		icon.setAttribute('class', 'map_unit_icon');
		icon.setAttribute('src', this.data.iconsrc);
		icon.setAttribute('alt', this.name);
		this.icon = icon;
		document.getElementById('map').appendChild(icon);
		this.setIconListener();
		this.move(this.x, this.y);
	}
	blink(color, duration) {
		if(this.icon != undefined){
			this.icon.style.backgroundColor = color;
			setTimeout(() => {
				if (this.icon != undefined) {
					if (NPCs.currentSelected != undefined) {
						this.icon.style.backgroundColor = NPCs.currentSelected.id == this.id ? 'rgba(255, 255, 0, 0.329)' : this.originalColor;
					} else {
						this.icon.style.backgroundColor = this.originalColor;
					}
				}
			}, duration);
		}
	}
	iconClickListener(self) {
		let greenFilters = document.querySelector('.overlaytile-green');
		let party = scavenging.parties[scavenging.movingParty];
		if (party != undefined) {
			let distanceToParty = manhattanDistance(self.x, self.y, party.pos.x, party.pos.y);
			if (greenFilters != null && distanceToParty <= party.time * party.vehicle.speed) {
				/* party moving -> display interaction options */
				self.displayInteractionInfos();
				party.createNPCInteractionOptions(self);
				changePanel('NPCInteraction');
			}
		} else {
			self.displayOnPanel();
		}
		/* DEBUG */
		if (NPCs.currentSelected != undefined) NPCs.currentSelected.icon.style.backgroundColor = NPCs.currentSelected.originalColor;
		self.icon.style.backgroundColor = 'rgba(255, 255, 0, 0.329)';
		NPCs.currentSelected = self;
	}
	setIconListener() {
		let icon = document.getElementById(this.id);
		let self = this;
		icon.onclick = function () { self.iconClickListener(self) };
	}
	removeIconListener() {
		let icon = document.getElementById(this.id);
		icon.onclick = '';
	}
	eraseIcon() {
		let icon = document.getElementById(this.id);
		if (icon != null) {
			icon.parentNode.removeChild(icon);
		} else {
			console.log('eraseIcon: icon is null');
			console.log({ icon: icon, unit: this });
		}
		this.icon = undefined;
		//console.log({eraseIcon: icon});
	}
	moveRandom() {
		let dx = rand(-2, 2);
		let dy = rand(-2, 2);
		let newX = this.x + dx;
		let newY = this.y + dy;
		/* if not oob */
		if (!(newX > map.width - 1 || newX < 0 || newY > map.height - 1 || newY < 0)) {
			/* if landing tile is water or if middle tile is water (approximation) */
			if (map.layout[newY][newX].type == 'water' || map.layout[Math.round((this.y + newY) / 2)][Math.round((this.x + newX) / 2)].type == 'water') {
				this.moveRandom();
			} else {
				this.x = newX;
				this.y = newY;
				this.move(this.x, this.y);
			}
		} else {
			this.moveRandom();
		}
	}
	remove() {
		NPCs.reorganizeUnits();
		this.eraseIcon();
		NPCs.units[this.data.type + 's'].splice(this.index, 1);
	}
	displayOnPanel() {
		let debug = document.getElementById('NPCDebugMessage')
		debug.innerHTML = '';
		if (this.data.type == 'horde') {
			debug.innerHTML = `
            index: ${this.index}<br>
            id: ${this.id}<br>
            <br>
            members: ${this.data.members}
            `;
		} else if (this.data.type == 'survivor') {
			debug.innerHTML = `
            index: ${this.index}<br>
            id: ${this.id}<br>
            <br>
            members: ${this.data.members}<br>
            equipment: ${this.data.equipment}<br>
            aggro: ${this.data.aggro}<br>
            trust: ${this.data.trust}<br>
            <br>
            trades: ${this.data.tradeCounter}<br>
            fights: ${this.data.fightCounter}<br>
            assemble: ${this.data.assembleCounter}<br>
            `;
		} else if (this.data.type == 'settlement') {
			document.getElementById('NPCDebugMessage').innerHTML = `
            index: ${this.index}<br>
            id: ${this.id}<br>
            <br>
            members: ${this.data.members}<br>
            equipment: ${this.data.equipment}<br>
            aggro: ${this.data.aggro}<br>
            trust: ${this.data.trust}<br>
            <br>
            trades: ${this.data.tradeCounter}<br>
            fights: ${this.data.fightCounter}<br>
            assemble: ${this.data.assembleCounter}<br>
            `;
		} else {
			console.error(new Error('unexpected data type.'));
		}
		changePanel('NPC');
	}
	displayInteractionInfos() {
		if (this.data instanceof Horde) {
			document.getElementById('survivorInteractionMessage').classList.add('hidden');
			document.getElementById('hordeInteractionMessage').classList.remove('hidden');
		} else if (this.data instanceof Survivor) {
			document.getElementById('survivorInteractionMessage').classList.remove('hidden');
			document.getElementById('hordeInteractionMessage').classList.add('hidden');
		} else {
			console.error(new Error('unexpected data type.'));
		}
		changePanel('NPCInteraction');
	}
	settle() {
		if (this.data.type != 'survivor') {
			console.error(new Error("NPC of type '" + this.data.type + "' can't settle."));
		} else {
			/* change icon */
			this.remove();
			this.data = new NPCCamp(this.data);
			this.name = 'Survivor settlement';
			this.createIcon();
			/* add background color to hide tile underneath */
			this.icon.style.backgroundColor = map.color.getCurrentColor();
			this.originalColor = map.color.originalColor;
			NPCs.units.settlements.push(this);

		}
	}
	runAwayFromCamp() {
		while (manhattanDistance(this.x, this.y, camp.pos.x, camp.pos.y) <= 5) {
			this.x = rand(0, map.width - 1);
			this.y = rand(0, map.height - 1);
		}
	}

}

class Horde {
	constructor() {
		this.type = 'horde';
		this.members = rand(15, 50);
		this.iconsrc = 'img/npc/hordeicon.png';
		this.playerDiscovered = {
			size: false,
		}
	}
	getSizeStr() {
		let hordeSize;
		if (this.members > 150) {
			hordeSize = { size: 'enormous', color: 'red' };
		} else if (this.members > 80) {
			hordeSize = { size: 'big', color: 'orange' };
		} else if (this.members > 30) {
			hordeSize = { size: 'medium', color: 'yellow' };
		} else {
			hordeSize = { size: 'small', color: 'lightgreen' };
		}
		return hordeSize;
	}
}

class Survivor {
	constructor() {
		this.type = 'survivor';
		this.name;
		this.members = randNormal(3, 15);
		this.iconsrc = 'img/npc/survivoricon.png';
		this.trust = randNormal(0, 100);
		this.aggro = randNormal(0, 100);
		this.equipment = randNormal(0, 70);
		this.tradeCounter = 0;
		this.fightCounter = 0;
		this.assembleCounter = 0;
		this.playerDiscovered = {
			sizeEstimate: undefined,
			size: false,
			equipment: false,
			type: false,
		}
	}
	getTendency() {
		/* 
		 *  returns an object which contains values that indicate the likelihood
		 *  the unit will do an action over the other
		 *  used in: NPCController.collisions()
		 */
		return {
			assemble: ((100 - this.aggro) + this.trust) / 2,
			trade: ((50 - this.aggro / 2) + this.trust) / 2,
			fight: (this.aggro + (50 - this.trust / 2)) / 2,
		};
	}
	gainTrust() {
		this.trust += Math.round(mapIntervals(this.trust, [0, 100], [10, 1]));//(this.trust - 1) * (1 - 10) / (99 - 1) + 10
	}
	gainAggro() {
		this.aggro += Math.round(mapIntervals(this.aggro, [0, 100], [10, 1]));//(this.aggro - 1) * (1 - 10) / (99 - 1) + 10
	}
	looseTrust() {
		this.trust -= 7;
		if (this.trust <= 0) {
			this.trust = 0;
		}
	}
	looseAggro() {
		this.aggro -= 7;
		if (this.aggro <= 0) {
			this.aggro = 0;
		}
	}
	getEquipStr() {
		let equipStr;
		if (this.equipment > 100) {
			equipStr = { str: 'military', color: 'green' };
		} else if (this.equipment > 60) {
			equipStr = { str: 'good', color: 'lightgreen' };
		} else if (this.equipment > 30) {
			equipStr = { str: 'decent', color: 'yellow' };
		} else {
			equipStr = { str: 'poor', color: 'red' };
		}
		return equipStr;
	}
	getTypeStr() {
		let typeStr;
		if (this.aggro > 70 && this.trust < 40) {
			typeStr = { str: 'they look like bandits', color: 'red' };
		} else if (this.aggro > 50 && this.trust < 60) {
			typeStr = { str: 'they look like alright people', color: 'yellow' };
		} else {
			typeStr = { str: 'they look like trustworthy people', color: 'green' };
		}
		return typeStr;
	}
}

class NPCCamp {
	/* camp created by an NPC Survivor group */
	constructor(owner) {
		this.type = 'settlement';
		this.members = owner.members;
		this.equipment = owner.equipment;
		this.trust = owner.trust;
		this.aggro = owner.aggro;
		this.iconsrc = 'img/npc/campicon.png';
		this.tradeCounter = owner.tradeCounter;
		this.fightCounter = owner.fightCounter;
		this.assembleCounter = owner.assembleCounter;
		this.icon = owner.icon;
	}
	produceSurvivor(position) {
		let abort = false;
		let spawnPosition = getTileXYFromId(selectSpawnTile());
		/* while the selected tile is of type 'water' or is undefined (OoB), select a new tile
		   but do not try more than 10 times */
		for (let i = 0; ['water', undefined].includes(map.layout[spawnPosition.y][spawnPosition.x].type); i++) {
			if (i == 10) {
				abort = true;
				break;
			}
			spawnPosition = getTileXYFromId(selectSpawnTile());
		}
		if (abort == false) {
			let unit = new NPC('Survivors', 'agent_survivor' + NPCs.survivorIdCounter, NPCs.survivorIdCounter, 'survivor', spawnPosition);
			unit.createIcon();
			NPCs.units.survivors.push(unit);
			NPCs.survivorIdCounter++;
			NPCs.reorganizeUnits();
			return unit;
		}

		

		function selectSpawnTile() {
			const adjTiles = getAdjacentTilesMap(`map${position.x}_${position.y}`);
			const selectedTile = selectRandomFromArray(adjTiles);
			return selectedTile.id;
		}
	}
}

class NPCController {
	constructor() {
		this.units = {
			hordes: [],
			survivors: [],
			settlements: [],
		}
		this.survivorIdCounter = 0;
		this.hordeIdCounter = 0;
		this.log = new Array();
		this.currentSelected = undefined;
	}
	addHordes(qty) {
		for (let i = 0; i < qty; i++) {
			let unit = new NPC('Horde', 'agent_horde' + this.hordeIdCounter, i, 'horde');
			unit.createIcon();
			this.units.hordes.push(unit);
			this.hordeIdCounter++;
		}
		this.reorganizeUnits();
	}
	addSurvivors(qty) {
		for (let i = 0; i < qty; i++) {
			let unit = new NPC('Survivors', 'agent_survivor' + this.survivorIdCounter, i, 'survivor');
			unit.createIcon();
			this.units.survivors.push(unit);
			this.survivorIdCounter++;
		}
		this.reorganizeUnits();
	}
	reorganizeUnits() {
		Object.getOwnPropertyNames(NPCs.units).forEach((type) => {
			this.units[type].forEach((unit, index) => {
				if (unit.index != index) {
					unit.removeIconListener();
					unit.index = index;
					unit.setIconListener();
				}
			});
		});
	}
	getTotalSurvivorMembers() {
		let humans = 0;
		this.forAllUnits((unit) => {
			if (unit.data.type == 'survivor' || unit.data.type == 'npc_camp') {
				humans += unit.data.members;
			}
		});
		humans += player.getPop();
		return humans;
	}
	getTotalHordeMembers() {
		let zombies = 0;
		this.forAllUnits((unit) => {
			if (unit.data.type == 'horde') {
				zombies += unit.data.members;
			}
		});
		return zombies;
	}
	forAllUnits(callback) {
		Object.getOwnPropertyNames(NPCs.units).forEach((type) => {
			this.units[type].forEach((unit) => {
				callback(unit, this.units[type], type);
			});
		});
	}
	updatePositionAll() {
		this.forAllUnits((unit) => {
			unit.move(unit.x, unit.y);
		});
	}
	moveRandomAll() {
		this.forAllUnits((unit) => {
			if (unit.data.type != 'settlement') { unit.moveRandom() }
		});
	}
	collisions() {
		let a = [];// avoid checking units multiple times

		/* INTERNAL NPC INTERACTIONS */
		this.forAllUnits((unit1) => {
			if (unit1.x == player.campPos.x && unit1.y == player.campPos.y) {
				this.addLogEntry({ campinteraction: unit1 });
			}
			this.forAllUnits((unit2) => {
				if (unit1.id != unit2.id && !(a.includes(unit1.id) && a.includes(unit2.id))) {
					if (unit1.x == unit2.x && unit1.y == unit2.y) {
						this.addLogEntry({ coll_unit1: unit1, coll_unit2: unit2 });
						a.push(unit2.id);
						a.push(unit1.id);
						let typeTable = [unit1.data.type, unit2.data.type];

						/* HORDE VS HORDE */
						if (unit1.data.type == 'horde' && unit2.data.type == 'horde') {
							/* hordes merge */
							unit1.data.members += Math.floor(unit2.data.members * 0.85);
							unit1.blink('green', 100);
							this.addLogEntry('horde merge');
							unit2.remove();
						}
						/* SURVIVOR VS SURVIVOR */
						else if (unit1.data.type == 'survivor' && unit2.data.type == 'survivor') {
							let tendency1 = unit1.data.getTendency();
							let tendency2 = unit2.data.getTendency();
							let action1 = selectAction(tendency1);
							let action2 = selectAction(tendency2);
							this.addLogEntry({ a1: action1, a2: action2 });
							/* ASSEMBLE */
							if (action1 == 'assemble' && action2 == 'assemble') {
								unit1.data.members += unit2.data.members;
								unit1.data.trust = Math.floor((unit1.data.trust + unit2.data.trust) / 2);
								unit1.data.aggro = Math.floor((unit1.data.aggro + unit2.data.aggro) / 2);
								unit1.data.equipment = Math.floor((unit1.data.equipment + unit2.data.equipment) / 2);
								unit1.data.fightCounter += unit2.data.fightCounter;
								unit1.data.assembleCounter += unit2.data.assembleCounter;
								unit1.data.tradeCounter += unit2.data.tradeCounter;
								unit1.data.gainTrust();
								unit1.data.assembleCounter++;
								this.addLogEntry('survivor merge');
								unit1.blink('green', 100);
								unit2.remove();
							}
							/* FIGHT */
							else if (action1 == 'fight' || action2 == 'fight') {
								/* PURPOSEFUL BATTLE */
								if (action1 == action2) {
									NPCs.combat(unit1, unit2);
								}
								/* SURPRISE ATTACK */
								else {
									/* one side was not expecting the fight */
									this.addLogEntry('ambush');
									let atk, def;
									if (action1 == 'fight') {
										atk = unit1;
										def = unit2;
									} else {
										atk = unit2;
										def = unit1;
									}
									atk.data.fightCounter++;
									def.data.fightCounter++;

									atk.blink('red', 100);
									def.blink('orange', 100);

									let defRatio = def.data.members / atk.data.members;
									if (defRatio < 0.2) {
										/* no chance */
										def.remove();
										atk.data.gainAggro();
										this.addLogEntry('def got crushed');
									} else if (defRatio > 2) {
										/* good chance of defense */
										this.addLogEntry('def was able to escape the ambush');
										let success = rand(0, 100);
										def.data.looseTrust();
										def.data.looseAggro();
										atk.data.looseAggro();
										if (success > 30) {

										}
									} else {

									}
								}
							}
							/* TRADE */
							else if (action1 == 'trade' && action2 == 'trade') {
								unit1.data.gainTrust();
								unit1.data.equipment += 10;
								unit1.data.tradeCounter++;
								unit2.data.gainTrust();
								unit2.data.equipment += 10;
								unit2.data.tradeCounter++;
								this.addLogEntry('trade');

								unit1.blink('lightgreen', 100);
								unit2.blink('lightgreen', 100);
							}
							else {
								this.addLogEntry('Nothing happened');
							}
						}
						/* HORDE VS SURVIVOR */
						else if (typeTable.includes('horde') && typeTable.includes('survivor')) {

							let horde, survivor;
							if (unit1.data.type == 'horde') {
								horde = unit1;
								survivor = unit2;
							} else {
								horde = unit2;
								survivor = unit1;
							}
							let avoid;
							if (horde.data.members > 10 * survivor.data.members) {
								avoid = 99;
							} else if (horde.data.members > 5 * survivor.data.members) {
								avoid = 80;
							} else if (horde.data.members > 3 * survivor.data.members) {
								avoid = 35;
							} else {
								avoid = 10;
							}
							let choice = rand(0, 100);
							if (choice < avoid) {
								/* avoid */
								let success = rand(0, 100);
								if (success < 15) {
									/* failure */
									this.addLogEntry('survivor failed at avoiding the horde and everybody died.')
									horde.data.members += Math.floor(0.7 * survivor.data.members);
									survivor.remove();
								} else if (success < 40) {
									/* partial failure */
									let mem = survivor.data.members;
									let losses = rand(Math.round(mem - 0.8 * mem), Math.round(mem - 0.15 * mem));
									this.addLogEntry({ mem: mem, losses: losses });
									this.addLogEntry('survivor partially failed at avoiding the horde, and suffered ' + losses + ' losses.');
									horde.data.members += Math.floor(0.7 * losses);
									survivor.data.members -= losses;
									survivor.data.looseAggro();
									if (survivor.data.members <= 0) {
										survivor.remove();
									}
								} else {
									this.addLogEntry('survivors were able to sneak past the horde, suffering no loss');
								}
							} else {
								/* fight */
								let ls = rand(0, horde.data.members / 1.7);
								let lh = rand(0, survivor.data.members + (survivor.data.members * survivor.data.equipment / 50));

								if (ls >= survivor.data.members) {
									this.addLogEntry('survivor tried fighting the horde but got anihilated');
									survivor.remove();
								} else if (ls > survivor.data.members * 0.3) {
									this.addLogEntry('survivor tried to fight the horde but suffered ' + ls + ' losses')
									survivor.data.looseAggro();
									survivor.data.members -= ls;
								} else {
									this.addLogEntry('survivor tried to fight the horde and suffered ' + ls + ' losses')
									survivor.data.members -= ls;
								}
								if (lh >= horde.data.members) {
									this.addLogEntry('the horde got anihilated during a battle');
									horde.remove();
								} else {
									this.addLogEntry('the horde lost ' + lh + ' members but gained ' + Math.floor(0.7 * ls));
									horde.data.members -= lh;
									horde.data.members += Math.floor(0.7 * ls);
								}
							}
						}
					}
				}
			});
		});

		/* WORLD INTERACTION */
		this.forAllUnits((unit) => {
			/* if the unit has not collisioned with another unit this turn */
			if (!a.includes(unit.id)) {
				/* if unit is a survivor, not a horde */
				if (unit.data.type == 'survivor') {
					let td = map.layout[unit.y][unit.x];

					/* if the tile is scavengeable */
					if (scavengeableTypes.includes(td.type) && td.resourceLevel > 0) {
						let randTry = rand(0, 100);
						if (randTry > 30) {
							let m = randNormal(1, 5, undefined, 8)
							td.looseResource(m);
							unit.data.equipment += m;

							unit.blink('yellow', 100);
						}
					}

					if (['forest', 'plain'].includes(td.type) && manhattanDistance(unit.x, unit.y, camp.pos.x, camp.pos.y) > 5) {
						/* temp to be replaced with hapiness function or whatever */
						let temp = rand(0, 1000);
						if (unit.data.equipment > 300 && temp > 995) {
							unit.settle();
							unit.data.equipment -= 150;
						}
					}


				} else if (unit.data.type == 'settlement') {
					unit.data.members += 1;
					if(unit.data.members > 50 && rand(0, 100) > 75){
						let survivorProduced = unit.data.produceSurvivor({x: unit.x, y: unit.y});
						if(survivorProduced){
							unit.data.members -= survivorProduced.data.members;
						}
					}
				}
			}
		});

		this.reorganizeUnits();

		function selectAction(tendency) {
			let sum = tendency.fight + tendency.trade + tendency.assemble;
			let r = rand(0, sum);
			if (r > tendency.fight + tendency.trade) {
				/* assemble */
				return 'assemble';
			} else if (r > tendency.fight) {
				/* trade */
				return 'trade';
			} else {
				/* fight */
				return 'fight';
			}
		}
	}
	getUnitById(id) {
		let runit;
		this.forAllUnits((unit) => {
			if (unit.id == id) {
				runit = unit;
			}
		});
		return runit;
	}
	addLogEntry(entry) {
		let logEntry = {
			day: player.day,
			entry: entry,
		}
		this.log.push(logEntry);
	}
	progress(days = 1) {
		for (let i = 0; i < days; i++) {
			this.moveRandomAll();
			this.collisions();
			if (this.currentSelected != undefined) this.currentSelected.displayOnPanel();
		}
	}
	combat(unit1, unit2) {
		unit1.fightCounter++;
		unit2.fightCounter++;
		this.addLogEntry('battle:', unit1, 'vs.', unit2);

		let losses1 = rand(0, unit2.data.members);
		let losses2 = rand(0, unit1.data.members);
		/* unit 1 losses */
		if (losses1 >= unit1.data.members) {
			this.addLogEntry(unit1.id + ' was anihilated');
			unit1.remove();
		} else if (losses1 > unit1.data.members * 0.8) {
			unit2.data.members += unit1.data.members - losses1;
			this.addLogEntry(unit1.id + ' were killed in battle, and ' + unit1.data.members - losses1 + ' were made prisoners');
			unit1.remove();
		} else if (losses1 > unit1.data.members * 0.3) {
			this.addLogEntry('unit 1 suffered ' + losses1 + ' losses in battle.');
			unit1.data.gainAggro();
			unit1.data.members -= losses1;
			unit1.data.equipment -= 30;
			unit1.blink('red', 100);
		}
		/* unit 2 losses*/
		if (losses2 >= unit2.data.members) {
			this.addLogEntry(unit2.id + ' was anihilated');
			unit2.remove();
		} else if (losses2 > unit2.data.members * 0.9) {
			unit1.data.members += unit2.data.members - losses2;
			this.addLogEntry(unit2.id + ' were killed in battle, and ' + unit2.data.members - losses2 + ' were made prisoners');
			unit2.remove();
		} else if (losses2 > unit2.data.members * 0.3) {
			this.addLogEntry('unit 2 suffered ' + losses2 + ' losses in battle.');
			unit2.data.gainAggro();
			unit2.data.members -= losses2;
			unit2.data.equipment -= 30;
			unit2.blink('red', 100);
		}
	}
}

function getUnitIcons() {
	return document.querySelectorAll('.map_unit_icon');
}