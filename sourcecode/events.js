function nextDay() {
	let resChange = document.getElementById('dRecapResourceChange');
	let messages = document.getElementById('dRecapMessages');
	/* close site details if opened */
	if (!siteDet.isHidden()) { siteDet.hide(); }

	NPCs.progress();
	scavengingProgress();
	buildProgress();
	updateGroupInfo();

	//End of day resource changes
	/* FOOD */
	let totalFoodLoss = 0;
	camp.people.members.forEach((per, i) => {
		if (camp.resources.food > 0) {
			totalFoodLoss += player.foodRation;
		}
		per.hungerLoss();
		per.eat(player.foodRation, camp.resources); // removes food in inventory and adds hunger to the person

		if (per.sick) {
			if (camp.resources.drugs >= 0) {
				camp.resources.drugs--; // use drug
				let cured = rand(0, 100); // get cured maybe
				if (cured > 50) { per.sick = false }
			}
			if (per.sickTimeCounter < per.diseaseResistance) {
				per.sickTimeCounter++;
			} else {
				camp.people.deathId(per.id);
			}
		} else {
			per.getSickMaybe(); // opportunity to get sick
		}
		if (per.hunger <= -25) {
			camp.people.deathId(per.id);
		}
	});
	endOfDayBuffer.food -= totalFoodLoss;

	/* Day based events (milestones ?) */
	player.day++;
	if (player.day == 1000) {
		alert(`All zombies have rotten away. It's now time to rebuild civilisation from its ashes... You can stop playing now.`);
	}
	if (player.getPop() == 0) {
		alert('All survivors in your group died. Game Over.');
	}

	/* compute events */
	if (displayEndOfDayEvents) {
		let somethingHappened = computeDaEvents();//returns true if sth happened and false if not
		if (somethingHappened) {
			evtDet.show();
			document.getElementById('bNextDay').classList.add('hidden');
		}
	}

	//Display end of day recap
	resChange.innerHTML = '';
	messages.innerHTML = '';

	let numberRecap = '';
	numberRecap += `Food:   ${addSign(endOfDayBuffer.food)} <br>`;
	numberRecap += `Ammo:   ${addSign(endOfDayBuffer.ammo)} <br>`;
	numberRecap += `Drugs:  ${addSign(endOfDayBuffer.drugs)} <br>`;
	numberRecap += `Electronics:  ${addSign(endOfDayBuffer.electronics)} <br>`;
	numberRecap += `Wood:   ${addSign(endOfDayBuffer.wood)} <br>`;
	numberRecap += `Metal:  ${addSign(endOfDayBuffer.metal)} <br>`;
	numberRecap += `Concrete:  ${addSign(endOfDayBuffer.concrete)} <br>`;
	numberRecap += `Cloth:  ${addSign(endOfDayBuffer.cloth)} <br>`;
	resChange.innerHTML = numberRecap;
	if (displayEndOfDayRecap) {
		document.getElementById('menuRecap').classList.remove('hidden');
		document.getElementById('leftpanel-commandscontainer').classList.add('hidden'); //Hide commands
	}
	endOfDayBuffer.reset();
	updateMetrics();
	/* left panel changes */
	if (player.currentPanel == 'NPCInteraction') {
		changePanel();//reset to default
	}

	function scavengingProgress() {
		removeMovementMap();
		scavenging.parties.forEach(function (party, gn) {
			if (party.inMission) {
				party.time = partiesTimeLimit;//reset AP
				party.people.members.forEach((per) => {
					per.hungerLoss();
					per.eat(player.foodRation, party.inventory);//removes food in inventory and adds hunger to the person
					per.getSickMaybe();//opportunity to get sick
				});
				updateGroupOptions(gn);
				//party.checkNPCCollision();
			}
			document.getElementById('dPartyNotif' + gn).innerHTML = '';
		});
	}

	function buildProgress() {
		camp.buildingCounter.count.forEach(obj => {
			if (obj.qty > 0) {
				let building = build.getByIdName(obj.idName);
				if (building.onDayEnd != undefined) building.onDayEnd(obj.qty);
			}
		});
	}
}

/* function skipDays(n) {
    for (let i = 0; i < n; i++) {
        nextDay();
    }
} */

function computeDaEvents() {
	let somethingHappens = rand(0, 100) > 75 ? true : false;
	if (somethingHappens) {
		evtDet.options.innerHTML = '';
		let randomEvent = rand(0, 100);

		/* 
				people showing up to join
		*/

		if (randomEvent > 30) {
			let unique = rand(0, 100);
			unique = unique > 65 ? true : false;
			//unique = true;
			if (unique) {
				evtDet.setMessage('A lone survivor arrived in the night. He says he is willing to work for shelter.');

				/* OPTIONS */

				evtDet.addOption('Let him in.', function () {
					let survivor = new Person();
					evtDet.setMessage('The survivor joined your camp.');
					camp.people.addPeople(survivor);

					evtDet.endOption();
				}, camp.maxPeople - player.getPop() < 1);
				evtDet.addOption('Tell him to go.', function () {
					evtDet.setMessage('The survivor left without trouble.');

					evtDet.endOption();
				});
				evtDet.addOption('Kill him !', function () {
					player.karma -= 3;
					let fight = rand(0, 100) > 25 ? true : false;//does the survivor put up a fight ?
					let killed = false;//does he get killed by doing that ?
					let kills = false;//does he kill some of our people ?

					if (fight) {
						killed = rand(0, 100) > 35 ? true : false;
						kills = rand(0, 100) > 65 ? true : false;
					}

					/* loot */
					let ammoCost = rand(1, 5);
					let lootPool = new LootPool(
						new LootPoolItem('food', 3, 10, 4),
						new LootPoolItem('ammo', 1, 10, 3),
						new LootPoolItem('drugs', 1, 3, 1),
						new LootPoolItem('fuel', 1, 2, 1),
						new LootPoolItem('wood', 2, 15, 2),
						new LootPoolItem('metal', 1, 5, 1)
					)

					let loot = lootPool.randomizeLoot(1, 1);

					let resMsg;
					let msg;
					if (killed) {
						msg = 'We managed to kill the stranger';
						/* apply loot */
						loot.addItem(new Loot('ammo', -ammoCost), 'start');//add at start of array
						loot.addToInv(camp.resources);
						resMsg = generateResourceChangeList(loot);
					} else {
						msg = 'The stranger escaped';
						/* only apply ammo loss, since the man escaped */
						new LootItem('ammo', -ammoCost).applyToInv(camp.resources);
						resMsg = `(${-ammoCost} ammo)`;
					}
					if (fight) {
						msg += ', after a short fight. ';
					} else {
						msg += '. ';
					}
					if (kills) {
						let victims = rand(1, 3);
						msg += 'He killed <span class="bold">' + victims + '</span> of our own. ';
						camp.people.deathQty(victims);
					} else {
						msg += 'No one from our side was killed. ';
					}
					msg += resMsg;
					evtDet.setMessage(msg);

					evtDet.endOption();
				}, camp.resources.ammo < 0);

				/* END OPTIONS */

			} else {
				let numberStrangers = rand(2, 5);
				evtDet.setMessage('A group of ' + numberStrangers + ' people demanding shelter arrived in the night.');

				/* OPTIONS */

				evtDet.addOption('Let them in.', function () {
					let people = [], names = [];
					for (let i = 0; i < numberStrangers; i++) { people.push(new Person()); }
					people.forEach((p) => names.push(p.name + ' ' + p.surname));
					evtDet.setMessage('They joined your camp.');
					camp.people.addPeople.apply(camp.people, people);

					evtDet.endOption();
				}, camp.maxPeople - player.getPop() < numberStrangers);
				evtDet.addOption('Kill them.', function () {
					player.karma -= 3 * numberStrangers;
					let fight = rand(0, 100) > 25 ? true : false;//does the survivor put up a fight ?
					let killed = false;//does he get killed by doing that ?
					let kills = false;//does he kill some of our people ?

					if (fight) {
						killed = rand(0, 100) > 15 ? true : false;
						kills = rand(0, 100) > 60 ? true : false;
					}

					/* loot */
					let ammoCost = rand(numberStrangers, numberStrangers * 5);
					let lootPool = new LootPool(
						new LootPoolItem('food', 9, 30, 4),
						new LootPoolItem('ammo', 3, 17, 3),
						new LootPoolItem('drugs', 2, 7, 1),
						new LootPoolItem('fuel', 1, 3, 1),
						new LootPoolItem('wood', 3, 15, 2),
						new LootPoolItem('metal', 3, 10, 1)
					)

					let loot = lootPool.randomizeLoot(1, 3);

					let resMsg;
					let msg;
					if (killed) {
						let strangerKilled = rand(1, numberStrangers)
						if (strangerKilled == numberStrangers) {
							msg = 'We managed to kill all the strangers';
						} else {
							if (strangerKilled != 1) {
								msg = 'We managed to kill ' + strangerKilled + ' of the strangers, the others escaped';
							}
							else {
								msg = 'We were only able to kill one of them, the others escaped'
							}

							/* modifiy loot qty in relation to number of strangers killed */
							/* loot.items.forEach((item, i, arr) => {
									item.qty = Math.round(item.qty / (numberStrangers / strangerKilled));//reduce loot if not all killed
									if (item.qty == 0) {
											arr.splice(i, 1);//remove loot if 0 qty;
									}
							}); */
							loot.applyMultiplier(1 / (numberStrangers / strangerKilled));
						}
						/* apply loot */
						loot.addLoot(new LootItem('ammo', -ammoCost), 'start');//add at start of array
						loot.addToInv(camp.resources);
						resMsg = generateResourceChangeList(loot);

					} else {
						msg = 'The strangers escaped';
						/* only apply ammo loss, since the man escaped */
						new LootItem('ammo', -ammoCost).applyToInv(camp.resources);
						resMsg = `(${-ammoCost} ammo)`;
					}
					if (fight) {
						msg += ', after a short fight. ';
					} else {
						msg += '. ';
					}
					if (kills) {
						let victims = rand(1, 5);
						msg += 'They killed <span class="bold">' + victims + '</span> of our own. ';
						camp.people.deathQty(victims);
					} else {
						msg += 'No one from our side was killed. ';
					}
					msg += resMsg;
					evtDet.setMessage(msg);

					evtDet.endOption();
				}, camp.resources.ammo < 0);
				evtDet.addOption('Tell them to go.', function () {
					evtDet.setMessage('The group of strangers left without trouble.');

					evtDet.endOption();
				});

				/* END OPTIONS */

			}
		}

		/* 
				Trade opportunity
		*/

		else {
			evtDet.setMessage('A nomad group proposes to trade.');

			/* OPTIONS */


		}
	}
	return somethingHappens;
}