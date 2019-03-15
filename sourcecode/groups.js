function updateGroupInfo() {
	document.getElementById('dAvPeople').innerHTML = camp.people.getTotalMembers();

	scavenging.parties.forEach(function (party, gn) {
		/* display available time and inventory only if party is in mission */
		let timeDiv = document.getElementById(g('partyTimeContainer', gn));
		if (party.inMission && timeDiv.classList.contains('hidden')) {
			timeDiv.classList.remove('hidden');
		} else if (!party.inMission && !timeDiv.classList.contains('hidden')) {
			timeDiv.classList.add('hidden');
		}
		let inventory = document.getElementById('inventory' + gn);
		if (party.inMission && inventory.classList.contains('hidden')) {
			inventory.classList.remove('hidden');
		} else if (!party.inMission && !inventory.classList.contains('hidden')) {
			inventory.classList.add('hidden');
		}
		document.getElementById('groupTotalItems' + gn).innerHTML = party.inventory.getSum();
		document.getElementById('groupMaxItems' + gn).innerHTML = party.vehicle.carry;
		document.getElementById('dPartyMembers' + gn).innerHTML = party.people.getTotalMembers();
		let max = party.vehicle.seats;
		if (max == undefined) { max = 15; }
		document.getElementById(g('dPartyMaxMembers', gn)).innerHTML = max;
		document.getElementById(g('dPartyTime', gn)).innerHTML = party.time;
		/* update inventory values display */
		Object.getOwnPropertyNames(party.inventory).forEach((name) => { document.getElementById(g(('dGroup' + firstLetterToUpperCase(name)), gn)).innerHTML = party.inventory[name]; });
		if (party.inMission) {
			let tileId = `map${party.pos.x}_${party.pos.y}`;
			moveElementOnTileMap(document.getElementById(g('partyIcon', gn)), tileId);
			document.getElementById('resourceInputs' + gn).classList.add('hidden');
			document.getElementById('inventory' + gn).classList.remove('hidden');
			if (party.time == 0) {
				party.setNotif(`There's nothing left to do here today.`, 'lightgrey');
			}
		} else {
			document.getElementById('resourceInputs' + gn).classList.remove('hidden');
			document.getElementById('inventory' + gn).classList.add('hidden');
		}
		//+/-/Send buttons
		let bPlus = document.getElementById(g('bPartyPlus', gn));
		let bMinus = document.getElementById(g('bPartyMinus', gn));
		let bSend = document.getElementById(g('bSendParty', gn));
		//enable +
		if (party.people.getTotalMembers() < max && bPlus.disabled && !party.inMission) {
			bPlus.disabled = false;
		}
		//disable +
		if (party.people.getTotalMembers() >= max && !bPlus.disabled || party.inMission) {
			bPlus.disabled = true;
		}
		//enable -
		if (party.people.getTotalMembers() > 0 && bMinus.disabled && !party.inMission) {
			bMinus.disabled = false;
		}
		//disable -
		if (party.people.getTotalMembers() <= 0 && !bMinus.disabled || party.inMission) {
			bMinus.disabled = true;
		}
		//enable send
		if (party.people.getTotalMembers() > 0 && bSend.disabled && !party.inMission) {
			bSend.disabled = false;
		}
		//disable send
		if ((party.people.getTotalMembers() <= 0 || party.inMission) && !bSend.disabled) {
			bSend.disabled = true;
		}
	});
	/* actions relative to currently moving party */
	if (scavenging.movingParty != undefined) {
		let p = scavenging.parties[scavenging.movingParty]
		p.updateNPCInteraction();
		updateGroupMovementMap(p.gn);
	}

}

function sendParty(gn) {
	let party = scavenging.parties[gn];
	if (party != undefined) {
		party.time = partiesTimeLimit;
		party.status = 1;
		party.inMission = true;
		party.pos = player.campPos;
		['food', 'ammo', 'drugs', 'fuel'].forEach((name) => {
			camp.resources[name] -= party.inventory[name];
			let input = document.getElementById(g('n' + firstLetterToUpperCase(name), gn));
			input.value = 0;
		});
		//Show message when group sent
		let message = document.getElementById(g('dPartyNotif', gn));
		message.innerHTML = 'The group is ready to receive orders.';
		message.style.color = 'white';
		/* create group icon */
		party.createIcon();
		updateGroupInfo(); //also places group icon on camp position
		updateMetrics();
		//display options as of what to do with the group
		updateGroupOptions(gn);
	} else {
		console.error(new Error('specified party does not exist. (sendParty: ' + gn + ')'));
	}
}

function updateGroupOptions(gn) {
	resetGroupOptions(gn);
	let party = scavenging.parties[gn];
	let currTile = map.layout[party.pos.y][party.pos.x];
	let type = currTile.type;
	/* MOVE */
	if (party.time > 0 && party.inventory.fuel > 0) {
		let greenFilters = document.querySelector('.overlaytile-green');
		text = greenFilters == null ? 'move' : 'stop';
		createGroupOption(gn, text, function () {
			toggleMovementMap(gn);
		});
	}
	switch (type) {
		case 'camp':
			createGroupOption(gn, 'end mission', function () {
				party.setNotif('All scavenged equipment is safe in your camp. The scavengers went back to their family for the night.', 'lightgreen');
				party.transferInventoryToCamp();
				party.reset();
				updateMetrics();
				updateGroupInfo();
				resetGroupOptions(gn);
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
	if (scavengeableTypes.includes(currTile.type) && party.time >= 3) {
		createGroupOption(gn, 'scavenge (3h)', scavenge);
	}
	/* NO MORE FUEL */
	if (party.inventory.fuel == 0 && party.vehicle.type != 'foot') {
		createGroupOption(gn, 'Abandon car', function () {
			resetGroupOptions(gn);
			party.setNotif(`Are you sure ? We won't be able to get it back later.`);

			createGroupOption(gn, 'yes', function () {
				party.vehicle = vehicles.foot
				party.setNotif('We got rid of the car.');
				updateGroupInfo();
				updateGroupOptions(party.gn);
			});
			createGroupOption(gn, 'no', function () {
				party.setNotif('');
				updateGroupInfo();
				updateGroupOptions(party.gn);
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
			updateGroupInfo();
			updateGroupOptions(party.gn);
		});
	}
	/* case when the tile has an adjacent tile that's water */
	if (hasAdjacentTypeMap(currTile.id, 'water')) {
		if (party.time >= 1 && currTile.typeIndex != map.indexTable.camp) {
			createGroupOption(gn, 'Fish (1h)', function () {
				party.time -= 1;
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
				updateGroupInfo();
				updateGroupOptions(gn);//display 'transfer loot' option if fishing on camp tile
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
			updateGroupInfo();
			updateGroupOptions(party.gn);
		}

	}
}

function resetGroupOptions(gn) {
	let commands = document.getElementById(g('partyCommands', gn));
	commands.innerHTML = '';
}

function createGroupOption(groupNumber, value, handler) {
	let commandsDiv = document.getElementById(g('partyCommands', groupNumber));
	createButton(value, commandsDiv, handler);
}

function toggleMovementMap(gn) {
	let greenFilters = document.querySelector('.overlaytile-green');
	if (greenFilters == null) {// There is no overlay
		createMovementMap(gn);
	} else {
		removeMovementMap();
	}
	updateGroupOptions(gn);
}

function createMovementMap(gn) {
	let party = scavenging.parties[gn];
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
	scavenging.movingParty = gn;
}

function removeMovementMap() {
	let divs = document.querySelectorAll('.overlaytile-green');
	divs.forEach((div) => document.getElementById('map').removeChild(div));
	scavenging.movingParty = undefined;
}

function updateGroupMovementMap(gn) {
	removeMovementMap();
	if (scavenging.parties[gn].time > 0) createMovementMap(gn);
}