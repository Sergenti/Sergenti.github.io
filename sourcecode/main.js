/////////////////////////////GLOBAL VARIABLES////////////////////////////////////
console.log('startup...')
const tileSize = 64;// px
const defaultsrc = 'img/default_tile.png';
const partiesTimeLimit = 12; // hours per day
const houseMaxPopIncrease = 5;
const displayEndOfDayRecap = false;
const displayEndOfDayEvents = true;
const includeNPCs = false;
const scavengeableTypes = ['plain', 'factory', 'city_s', 'city_m', 'city_l', 'forest', 'gas_station'];
const zombieFightEfficiency = 1 / 30; // zombies / humans
const animationFramesPerTile = 15;
const version = 'alpha 0.5.3';

let player = new Player();
let build = new BuildController();
let camp = new Site(64, 64, 'camp');
let map = {
	height: 100, // tiles
	width: 100,

	layout: [],
	selectedTileId: undefined,

	color: new MapColor(),

	//in tiles.js
	layoutTiles: getLayoutTiles(),
	indexTable: getIndexTable(),
}

let endOfDayBuffer = new Inventory();
endOfDayBuffer.reset = function () {
	let self = this;
	Object.getOwnPropertyNames(this).forEach((property) => { if (property != 'reset') { self[property] = 0 }/* don't reset this function */ });
}

let editor = {
	activeMap: false,
	currentElemMap: 0,
	toggle: function () {
		if (this.activeMap == false) {
			map.layout.forEach(function (line) {
				line.forEach(function (elem) {
					let tile = document.getElementById(elem.id);
					tile.addEventListener('click', elem.ct);
				});
			});
			toolbox.toggle();
			this.activeMap = true;
			console.log('map editor active.');
		} else {
			map.layout.forEach(function (line) {
				line.forEach(function (elem) {
					let tile = document.getElementById(elem.id);
					tile.removeEventListener('click', elem.ct);
				});
			});
			toolbox.toggle();
			this.activeMap = false;
			console.log('map editor inactive.');
		}
	},
	export: function () {
		let arr = [];
		map.layout.forEach((line, y) => {
			arr.push([]);
			line.forEach((elem, x) => {
				arr[y].push(elem.typeIndex);
			});
		});
		return JSON.stringify(arr);
	},
	stringify: function () {
		let arr = [];
		map.layout.forEach((lineData, y) => {
			arr.push([]);
			lineData.forEach((tileData) => {
				arr[y].push(
					new StoredTileData(
						tileData.typeIndex,
						tileData.discovered,
						tileData.resourceLevel,
						tileData.vehicleMemory
					));
			});
		});
		return JSON.stringify(arr);
	}
};

let toolbox = {
	tool: 'pencil',
	// launched at startup
	fill: function () {
		map.layoutTiles.forEach(function (elem, index) {
			let icon = document.createElement('img');
			icon.src = elem.src;
			icon.alt = elem.alt;
			icon.title = elem.alt;
			icon.style.backgroundColor = map.color.getCurrentColor();
			icon.addEventListener('click', function () { editor.currentElemMap = index });

			let tbtc = document.getElementById('toolbox_tileContainer');
			tbtc.appendChild(icon);
			tbtc.style.width = '350px';
		});
	},
	toggle: function () {
		let toolboxDiv = document.getElementById('toolbox');
		if (toolboxDiv.classList.contains('hidden')) {
			toolboxDiv.classList.remove('hidden');
		} else {
			toolboxDiv.classList.add('hidden');
		}
	},
	changeTool: function (toolStr) {

	}
};

const vehicles = {
	/* (type, speed (tiles/hours), carry, unitsPerFuelLoss, fuelLoss) */
	foot: new Vehicle({
		type: 'foot',
		speed: 1 / 12,
		carry: 300,
		unitsPerFuelLoss: undefined,
		fuelLoss: 0,
		seats: undefined,
		iconsrc: 'img/partyicon.gif',
	}),
	small_car: new Vehicle({
		type: 'small_car',
		speed: 1 / 4,
		carry: 750,
		unitsPerFuelLoss: 3,
		fuelLoss: 1,
		seats: 4,
		iconsrc: 'img/partyicon.gif',
	}),
	truck: new Vehicle({
		type: 'truck',
		speed: 1 / 6,
		carry: 2000,
		unitsPerFuelLoss: 3,
		fuelLoss: 2,
		seats: 6,
		iconsrc: 'img/partyicon.gif',
	}),
	dev_roadster: new Vehicle({
		type: 'dev_roadster',
		speed: 1,
		carry: 100000,
		unitsPerFuelLoss: 1000,
		fuelLoss: 0,
		seats: 1000,
		iconsrc: 'img/devroadster.gif',
	}),
}

let scavenging = {
	parties: [],
	selectedParty: undefined,
	movingParty: undefined,
	getTotalScavengers: function () {
		return this.parties.reduce((total, party) => total += party.people.getTotalMembers(), 0);
	},
	getMaxWorkers: function () {
		let max = 0;
		this.parties.forEach(function (party) {
			if (party.vehicle.seats != undefined) {
				max += party.vehicle.seats;
			}
		});
		return max;
	},
	getMaxParties: function () {
		return build.buildings[build.indexTable.garage].limit;
	}
};

let sounds = {
	enabled: true,
	click: new Howl({
		src: ['sound/click.wav'],
	}),
	hammer: new Howl({
		src: ['sound/hammer.wav'],
		volume: 0.5,
	}),
};

let musics = new musicsController();

let NPCs = new NPCController();
let siteDet = new SiteDisplayController();
let evtDet = new EventDisplayController();
let IGWindow = new IGWindowController();
let TimerController = new EventTimerController();
let NPCInteraction = new NPCInteractionController();
const groupWarnings = new GroupWarningsController();
const tradeController = new TradeController();

/////////////////////////////////////SETUP///////////////////////////////////////
(async () => {
	/* keyboard events */
	document.onkeydown = function (evt) {
		evt = evt || window.event;
		var charCode = evt.keyCode || evt.which;
		if (charCode == 27) { // ESC
			evt.preventDefault();
			onEscapeKeyDown();
		}
	};
	document.getElementById('bNextDay').addEventListener('click', nextDay);
	document.getElementById('bGroups').addEventListener('click', toggleGroupsPanel);
	document.getElementById('bCamp').addEventListener('click', () => {
		updateMetrics();
		if (IGWindow.isHidden()) {
			siteDet.setTitle('CAMP');
			IGWindow.changeWindow('site');
			IGWindow.show();
		} else {
			if (IGWindow.currentWindow != 'site') {
				siteDet.setTitle('CAMP');
				IGWindow.changeWindow('site');
			} else {
				IGWindow.hide();
			}
		}
		if (player.currentPanel != 'default') {
			changePanel('default');
		}
	});
	document.getElementById('bRecapContinue').addEventListener('click', closeRecapMenu);
	document.getElementById('bSave').addEventListener('click', saveGame);
	document.getElementById('bDeleteSave').addEventListener('click', deleteSaveGame);
	document.getElementById('bEventContinue').addEventListener('click', evtDet.continue);
	document.getElementById('toolbox_bucketBtn').addEventListener('click', () => toolbox.tool = 'bucket');
	document.getElementById('toolbox_pencilBtn').addEventListener('click', () => toolbox.tool = 'pencil');
	document.getElementById('bMusic').addEventListener('click', () => {
		setTimeout(() => musics.start(), 500);
		document.getElementById('bMusic').classList.add('hidden');
	})

	let sT = document.getElementById('soundToggler');
	sT.addEventListener('click', soundToggler);
	if (sounds.enabled) sT.src = 'img/gui/sound.png';
	else sT.src = 'img/gui/no_sound.png';

	IGWindow.exit.addEventListener('click', () => { IGWindow.hide() });
	/* on window resize */
	window.addEventListener('resize', windowResized);

	// generate trading interface BEFORE any Party.updateInfo()
	NPCInteraction.generateTradingInterface();

	/* load preferences (sound)*/
	console.log('loading preferences...')
	const preferences = fetchPreferences();
	if (preferences) {
		sounds.enabled = preferences.sound_enable;
		/* if the sound is not enabled, change the sound toggler image accordingly (by default, the icon is set on) */
		if (sounds.enabled == false) {
			let toggler = document.getElementById('soundToggler');
			toggler.src = 'img/gui/no_sound.png';
			toggler.alt = 'Off';
			toggler.title = 'Sound Off';
			document.getElementById('bMusic').classList.add('hidden');
		}
	}
	/* open maps and data from save if exist, otherwise, generate new game */
	console.log('checking for local save...');
	let saved = true; // <- true to automatically load a saved game on launch
	/* check if save data is in localStorage */
	['mapJSON', 'playerDataJSON'].forEach(prop => {
		if (!localStorage.hasOwnProperty(prop)) { saved = false }
	})

	/* open saved game */
	if (saved == true) {
		/* version check */
		const tempPlayerData = JSON.parse(localStorage.getItem('playerDataJSON')).player;
		if (tempPlayerData.version != version) {
			console.log('outdated savefile version: ', tempPlayerData.version);
			console.log('current game version: ' + version);
			alert('The version of your savefile is outdated. We will generate a new game for you. Sorry.');
			localStorage.clear();
			await newGame();
		} else {
			openSavedGame();
			document.getElementById('bDeleteSave').classList.remove('hidden');
		}
	}
	/* create new game */
	else {
		await newGame();
	}
	console.log('loading display...');
	/* setup error handlers and  + / - / send button listeners in inputs in group panel */
	addGroupsWindowListeners();

	/* siteDet setup */
	build.fillBuy();
	build.fillDisplayers();

	addClickSound();
	unlockHorizontalScrolling('map');

	/* update all displayers in the game */
	updateMetrics();

	//DEV
	toolbox.fill();
	/* when the game is fully loaded */
	onReady(() => {
		//Hide loading screen
		document.getElementById('loadScr').classList.add('hidden');
		document.getElementById('game').classList.remove('hidden');

		//Set initial scroll position and set the size of playarea according to window dimensions
		windowResized();//<- need to do that when the panels are visible, otherwise offsetWidth = 0 !
		document.getElementById('playarea').style.left = document.getElementById('leftpanel').offsetWidth + 'px';
		NPCs.updatePositionAll();
		scrollToTile(player.campPos.x, player.campPos.y);

		// display the icon of the parties that are in mission
		scavenging.parties.forEach(p => {
			if (p.inMission) {
				p.updateIcon();
			}
		});
		console.log('done ! version ' + version);
		console.log('have fun !');
	});
})();
////////////////////////////////////LIBRARY//////////////////////////////////////
async function newGame() {
	console.log('generating new game...');
	openMap(await fetchMapData());

	if (includeNPCs) {
		//add NPC units
		NPCs.addHordes(150);
		NPCs.addSurvivors(300);
		console.log({ humans0: NPCs.getTotalSurvivorMembers(), zombies0: NPCs.getTotalHordeMembers() });
		NPCs.progress(200);
		NPCs.forAllUnits((unit) => unit.runAwayFromCamp());
		console.log({ humans150: NPCs.getTotalSurvivorMembers(), zombies150: NPCs.getTotalHordeMembers() });
	}

	//setup inventory
	camp.resources.food = 300;
	camp.resources.ammo = 100;
	camp.resources.fuel = 50;
	camp.resources.drugs = 25;

	camp.resources.wood = 0;
	camp.resources.metal = 0;
	camp.resources.concrete = 0;
	camp.resources.cloth = 0;
	camp.resources.electronics = 0;

	/* set number of people in the camp at start */
	camp.people.addPeople.apply(camp.people, generatePeople(5));
	/* generate parties */
	for (let gn = 0; gn < scavenging.getMaxParties(); gn++) {
		scavenging.parties.push(new Party(gn));
	}
	let firstParty = scavenging.parties[0];
	firstParty.unlocked = true;
	firstParty.vehicle = vehicles.small_car;
	createGroupsVignettes();
}
function windowResized() {
	let playarea = document.getElementById('playarea'),
		panel = document.getElementById('leftpanel'),
		event = document.getElementById('event'),
		evTotCont = document.getElementById('eventTotalContainer');

	let width = window.innerWidth;
	let height = window.innerHeight;
	let panelWidth = panel.offsetWidth;

	playarea.style.width = (width - panelWidth) + 'px';

	event.style.width = (width - panelWidth - 40) + 'px';
	event.style.height = (height - 40) + 'px';

	evTotCont.style.width = width - panelWidth + 'px';
	evTotCont.style.height = height;

	IGWindow.updateSize();
	/* don't display playarea if the screen width is lower than the left panel's width */
	if (width <= panelWidth && !playarea.classList.contains('hidden')) {
		playarea.classList.add('hidden');
	} else if (width > panelWidth && playarea.classList.contains('hidden')) {
		playarea.classList.remove('hidden');
	}
	/* set leftpanel-commandscontainer to take remaining vertical space in panel */
	let commands = document.getElementById('leftpanel-commandscontainer');
	let title = document.getElementById('leftpanel-title');
	let maincontainer = document.getElementById('leftpanel-maincontainer');
	commands.style.height = height - (title.offsetHeight + maincontainer.offsetHeight) + 'px';
}
function onEscapeKeyDown() {
	if (IGWindow.isHidden()) {
		if (scavenging.movingParty != undefined) {
			let party = scavenging.parties[scavenging.movingParties];
			removeMovementMap();
			if (IGWindow.currentWindow != 'groups') {
				IGWindow.changeWindow('groups');
				party.updateInfo();
			}
			IGWindow.show();
		}
	} else {
		IGWindow.hide();
	}

}
function addListenersOptions() {//broken
	let volume = document.getElementById('volumeOption');
	volume.addEventListener('input change', function () {
		let vol = volume.value;
		changeVolume(vol);
	})
}
function toggleOptions() {
	let options = document.getElementById('gameOptions');
	/* if (options.classList.contains('hidden')) {
			options.classList.remove('hidden');
	} else {
			options.classList.add('hidden');
	} */
	options.classList.toggle('hidden');
}
function soundToggler() {
	let toggler = document.getElementById('soundToggler');
	if (sounds.enabled) {
		toggler.src = 'img/gui/no_sound.png';
		toggler.alt = 'Off';
		toggler.title = 'Sound Off';

		musics.stop();
		document.getElementById('bMusic').classList.add('hidden');
		musics.enabled = false;
		sounds.enabled = false;
	} else {
		toggler.src = 'img/gui/sound.png';
		toggler.alt = 'On';
		toggler.title = 'Sound On';

		document.getElementById('bMusic').classList.remove('hidden');
		musics.enabled = true;
		sounds.enabled = true;
	}
	savePreferences();
}
function changeTile(id, typeIndex) {
	let pos = getTileXYFromId(id)
	let x = pos.x;
	let y = pos.y;

	if (isNaN(typeIndex)) {
		console.error(new Error('typeIndex is NaN: ' + typeIndex));
		typeIndex = 0;
	}

	let tileData;
	tileData = map.layout[y][x];
	if (tileData.typeIndex != typeIndex) {//avoids superfluous calls
		tileData.typeIndex = typeIndex;
		tileData.type = map.layoutTiles[typeIndex].type;
		tileData.setTypeDependentVariables();

		document.getElementById(id).src = map.layoutTiles[typeIndex].src;
		document.getElementById(id).alt = map.layoutTiles[typeIndex].alt;

		map.layout[y][x] = tileData;
	}
}
function fillFromTile(id, typeIndex) {
	const tilePos = getTileXYFromId(id);
	const startNode = [tilePos.x, tilePos.y];
	/* generate a fillLayout 2D array that contains 0 to indicate which tiles have been checked */
	let fillLayout = [];
	(function (fillLayout) {
		for (let i = 0; i < map.height; i++) {
			fillLayout.push([]);
			for (let j = 0; j < map.width; j++) {
				fillLayout[i].push(0);
			}
		}
	})(fillLayout)
	floodFill(startNode, fillLayout);

	function floodFill(node, fillLayout) {
		let x = node[0];
		let y = node[1];
		let dx, dy;
		//for all direct adjacent nodes
		for (let i = -1; i < 2; i++) {// Y
			dy = y + i;
			for (let j = -1; j < 2; j++) {// X
				dx = x + j;
				// is tile is in bound
				if (dy >= 0 && dy < map.height && dx >= 0 && dx < map.width) {
					if (xor(Math.abs(j) == 1, Math.abs(i) == 1) && !(j == 0 && i == 0)) {
						//if the adjacent tile is not a of the type selected and is not already checked
						if (map.layout[dy][dx].type != map.layoutTiles[typeIndex].type && fillLayout[dy][dx] == 0) {
							fillLayout[dy][dx] = 1;
							changeTile(`map${dx}_${dy}`, typeIndex);
							floodFill([dx, dy], fillLayout);
						} else {
							//we need to still say we checked the fence tile
							fillLayout[dy][dx] = 1;
						}
					}
				}
			}
		}
	}

}
function clickOnMapTile(tile) {
	let pos = getTileXYFromId(tile.id);
	let tileData = map.layout[pos.y][pos.x];
	//if map editor is active
	if (editor.activeMap) {
		map.selectedTileId = tile.id;
	}
	//if map editor is inactive
	else {
		if (tileData.type == 'camp') {
			updateMetrics();
			siteDet.setTitle('CAMP');
			IGWindow.changeWindow('site');
			IGWindow.show();
		}
	}

	document.getElementById('debugData').innerHTML = `<span style='font-weight: bolder; color: red;'>MAP DEBUG</span><br>
    id: ${tileData.id}<br>
    type: ${tileData.type}<br>
    alt: ${map.layoutTiles[tileData.typeIndex].alt}<br>
    resource lvl: ${tileData.resourceLevel}<br>
    resource decay: ${tileData.resourceDecay}<br>
    `;
}
//Update display
function updateMetrics() {
	let elements = {
		/* resources in default panel */
		dFood,
		dDrugs,
		dAmmo,
		dElectronics,
		dWood,
		dMetal,
		dConcrete,
		dPop,
		dFuel,
		dCloth,
	}
	/* fill element properties with the associated DOM element */
	Object.getOwnPropertyNames(elements).forEach((name) => {
		elements[name] = document.getElementById(name);
	});
	/* update default panel */
	document.getElementById('dPop').innerHTML = player.getPop();
	document.getElementById('dMaxPop').innerHTML = camp.maxPeople;
	document.getElementById('dDayCounter').innerHTML = player.day;
	['food', 'drugs', 'ammo', 'fuel', 'wood', 'concrete', 'metal', 'cloth', 'electronics']
		.forEach((name) => elements['d' + firstLetterToUpperCase(name)].innerHTML = camp.resources[name]);

	let sickppl = player.getTotalSick();
	document.getElementById('dSick').innerHTML = sickppl > 0 ? `<img src="img/gui/pop_sick.png" alt="Sick:" title='Sick'> <span style='color: orange;'>${sickppl}</span>` : '';
	/* update build window */
	document.getElementById('buildPanelAvWorkers').innerHTML = camp.getAvailableWorkers();
	build.updateButtons();
	build.updateDisplayers();
}
function toggleGroupsPanel() {
	let scPanel = document.getElementById('groupsPanel');
	if (scPanel.classList.contains('hidden')) {
		changePanel('groups');
		document.getElementById('bGroups').value = 'Settlement';
		updateGroupsVignettes();
	} else {
		changePanel();
		document.getElementById('bGroups').value = 'Groups';
	}
}
function changePanel(name) {//name of the panel we want to show
	let scPanel = document.getElementById('groupsPanel'),
		NPCPanel = document.getElementById('NPCPanel'),
		defaultPanel = document.getElementById('defaultPanel'),
		panelTitle = document.getElementById('panelTitle');
	if (name == undefined) {
		player.currentPanel = 'default';
	} else {
		player.currentPanel = name;
	}
	/* change panel */
	closeOtherThan(name);
	/* change Title */
	switch (name) {
		case 'groups':
			panelTitle.innerHTML = 'GROUPS MANAGER';
			break;
		case 'NPC':
			panelTitle.innerHTML = 'NPC INSPECTOR';
			break;
		case 'default':
		default: /* settlement */
			updateMetrics();
			panelTitle.innerHTML = 'SETTLEMENT';
	}

	function openPanel(name) {
		switch (name) {
			case 'groups':
				if (scPanel.classList.contains('hidden')) {
					scPanel.classList.remove('hidden');
				}
				break;
			case 'NPC':
				if (NPCPanel.classList.contains('hidden')) {
					NPCPanel.classList.remove('hidden');
				}
				break;
			case 'default':
			default: /* settlement */
				if (defaultPanel.classList.contains('hidden')) {
					defaultPanel.classList.remove('hidden');
				}
		}
	}

	function closePanel(...name) {
		name.forEach((n) => {
			switch (n) {
				case 'groups':
					if (!scPanel.classList.contains('hidden')) {
						scPanel.classList.add('hidden');
					}
					break;
				case 'NPC':
					if (!NPCPanel.classList.contains('hidden')) {
						NPCPanel.classList.add('hidden');
					}
					break;
				case 'default':
				default: /* settlement */
					if (!defaultPanel.classList.contains('hidden')) {
						defaultPanel.classList.add('hidden');
					}
			}
		});
	}

	function closeOtherThan(name = 'default') {
		let names = ['NPC', 'groups', 'default'];
		names = names.filter((n) => n != name);
		closePanel.apply(this, names);
		openPanel(name);
	}
}
function tilePosIsVisibleOnScreen(pos) {
	const playarea = document.getElementById('playarea');
	// get coordinates of the camera
	const camera = {
		start: {
			x: playarea.scrollLeft,
			y: playarea.scrollTop,
		},
		end: {
			x: playarea.scrollLeft + playarea.offsetWidth,
			y: playarea.scrollTop + playarea.offsetHeight,
		}
	}
	// get coodinates of this NPC
	const npcc = {
		start: {
			x: pos.x * tileSize,
			y: pos.y * tileSize,
		},
		end: {
			x: pos.x * tileSize + tileSize,
			y: pos.y * tileSize + tileSize,
		}
	}

	const isInsideCameraVertically = (npcc.end.y > camera.start.y) && (npcc.start.y < camera.end.y);
	const isInsideCameraHorizontally = (npcc.end.x > camera.start.x) && (npcc.start.x < camera.end.x)

	return (isInsideCameraHorizontally && isInsideCameraVertically);
}
function validateTrade() {
	const TIV = tradeController.getTradeInventoriesValues();
	if (TIV.party >= TIV.NPC) {
		// apply trade
		tradeController.tradeInventories['party'].forAll(resName => {
			// NPC -> party
			tradeController.participants['party'].inventory.addResource(resName, tradeController.tradeInventories['NPC'][resName]);
			tradeController.participants['NPC'].data.tradeInventory.addResource(resName, -tradeController.tradeInventories['NPC'][resName]);
			// party -> NPC
			tradeController.participants['NPC'].data.tradeInventory.addResource(resName, tradeController.tradeInventories['party'][resName]);
			tradeController.participants['party'].inventory.addResource(resName, -tradeController.tradeInventories['party'][resName]);
		});

		tradeController.reset();
		tradeController.participants.party.updateInfo();
		console.log('trade done !');
	}
}
function editorClickOnTile(id, typeIndex) {
	if (toolbox.tool == 'bucket') {
		fillFromTile(id, typeIndex);
	} else {
		changeTile(id, typeIndex);
	}
}

//End update display
function closeRecapMenu() {
	document.getElementById('menuRecap').classList.add('hidden');
	document.getElementById('leftpanel-commandscontainer').classList.remove('hidden');
}
function generatePeople(qty) {
	let people = [];
	for (let i = 0; i < qty; i++) { people.push(new Person()); }
	return people;
}
function $$$resources($ = 1000) {
	Object.getOwnPropertyNames(camp.resources).forEach((n) => camp.resources[n] += $);
	updateMetrics();
}
function $$$people($ = 5) {
	camp.people.addPeople.apply(camp.people, generatePeople($));
	updateMetrics();
}

//////////////////////////////////////DATA/////////////////////////////

function openMap(data, origin) {
	console.log('loading map...');
	let mapContainer = document.getElementById('map');
	//document.getElementById('map').innerHTML = '';
	while (mapContainer.firstChild) {
		mapContainer.removeChild(mapContainer.firstChild);
	}
	map.layout = [];
	data.forEach((line, y) => {
		map.layout.push([]);
		line.forEach((storedTileData, x) => {
			let tileData;
			if (origin == 'save') {
				tileData = new TileData(storedTileData.t, `map${x}_${y}`, storedTileData.d, storedTileData.r, storedTileData.vm);
			} else {
				tileData = new TileData(storedTileData, `map${x}_${y}`, false, 1000);
			}
			map.layout[y].push(tileData);

			let tile = document.createElement('img');
			tile.setAttribute('src', map.layoutTiles[tileData.typeIndex].src);
			tile.setAttribute('alt', map.layoutTiles[tileData.typeIndex].alt);
			tile.addEventListener('click', function () { clickOnMapTile(this) })
			tile.id = tileData.id;

			document.getElementById('map').appendChild(tile);
			tileData.updateImage();
			//if the tile is the camp
			if (tileData.typeIndex == map.indexTable.camp) {
				//set position of camp in the camp object
				player.campPos = getTileXYFromId(tileData.id);
				tile.style.cursor = 'pointer';
				camp.pos = player.campPos;
			}
		});
		document.getElementById('map').appendChild(document.createElement('br'));
	});
}
function saveGame() {
	let playerData = {
		player: player,
		camp: camp,
		parties: scavenging.parties,
		NPC: NPCs,
	}
	let mapJSON = editor.stringify();
	let playerDataJSON = JSON.stringify(playerData);
	localStorage.setItem('mapJSON', mapJSON);
	localStorage.setItem('playerDataJSON', playerDataJSON);
	let bDel = document.getElementById('bDeleteSave');
	if (bDel.classList.contains('hidden')) {
		bDel.classList.remove('hidden');
	}
	console.log('game saved.');
}
function openSavedGame() {
	console.log('loading saved game...');
	let mapJSON = localStorage.getItem('mapJSON');
	let playerData = JSON.parse(localStorage.getItem('playerDataJSON'));

	openMap(JSON.parse(mapJSON), 'save');

	player = playerData.player;
	scavenging.parties = playerData.parties;
	NPCs = playerData.NPC;
	camp = playerData.camp;

	/* PLAYER */
	Object.setPrototypeOf(player, Player.prototype);
	/* Player unlocks */
	if (player.researchUnlocked) {
		document.getElementById('researchTab').classList.remove('hidden');
	}
	if (player.garageUnlocked) {
		document.getElementById('garageTab').classList.remove('hidden');
	}

	/* CAMP */
	Object.setPrototypeOf(camp, Site.prototype);
	Object.setPrototypeOf(camp.resources, Inventory.prototype);
	Object.setPrototypeOf(camp.people, PeopleGroup.prototype);
	Object.setPrototypeOf(camp.buildingCounter, BuildingCounter.prototype);
	camp.people.members.forEach((per) => Object.setPrototypeOf(per, Person.prototype));

	/* MAP */
	Object.setPrototypeOf(map.color, MapColor.prototype);

	/* NPCs */
	Object.setPrototypeOf(NPCs, NPCController.prototype);
	NPCs.forAllUnits((unit) => {
		Object.setPrototypeOf(unit, NPC.prototype);
		switch (unit.data.type) {
			case 'survivor':
				Object.setPrototypeOf(unit.data, Survivor.prototype);
				break;
			case 'horde':
				Object.setPrototypeOf(unit.data, Horde.prototype);
				break;
			case 'settlement':
				Object.setPrototypeOf(unit.data, NPCCamp.prototype);
				break;
			default:
				console.error(new Error('unexpected unit type.'));
		}
		unit.createIcon();
		if (unit.data.type == 'settlement') unit.icon.style.backgroundColor = map.color.getCurrentColor();
	});

	/* PARTIES */
	scavenging.parties.forEach((party, gn) => {
		/* setting party objects as Party class instance to get access to Party methods
			 and setting party inventory to instance of Inventory to gain access to Inventory.prototype.getSum()*/
		Object.setPrototypeOf(party, Party.prototype);
		Object.setPrototypeOf(party.inventory, Inventory.prototype);
		Object.setPrototypeOf(party.people, PeopleGroup.prototype);

		party.people.members.forEach((per) => Object.setPrototypeOf(per, Person.prototype));
		if (!party.sendable) {
			party.sendable = true;
		}
		/* changing display for parties that are in mission
			 create a party icon */
		if (party.inMission) {
			['food', 'ammo', 'fuel'].forEach((name) => {
				let input = document.getElementById('n' + firstLetterToUpperCase(name));
				input.classList.add('hidden');
				input.value = 0;
				let d = document.getElementById('dGroup' + firstLetterToUpperCase(name));
				d.innerHTML = party.inventory[name];
				d.classList.remove('hidden');
			});
			//Show message when group sent
			party.setNotif('Ready to receive orders.', 'lightgreen');
			//Display group icon
			party.createIcon();

		}
	});
	createGroupsVignettes();
	scavenging.parties.forEach((party) => party.updateInfo() /*also places the icon on the map*/);
}
function deleteSaveGame() {
	localStorage.clear();
	document.getElementById('bDeleteSave').classList.add('hidden');
	console.log('gamesave erased.');
}
function savePreferences() {
	let pref = {
		sound_enable: sounds.enabled,
	}
	localStorage.setItem('preferences', JSON.stringify(pref));
}
function fetchPreferences() {
	if (localStorage.hasOwnProperty('preferences')) {
		let pref = JSON.parse(localStorage.getItem('preferences'));
		return pref;
	}
	return null;
}

function fetchMapData() {
	return fetch('./sourcecode/mapdata.json')
		.then(result => {
			return result.json();
		}).then((mapJSON) => {
			return mapJSON.mapData;
		})

}

function generateNewMap(width, height) {
	map.layout = [];
	document.getElementById('map').innerHTML = '';

	for (let y = 0; y < height; y++) {
		map.layout.push([]);
		for (let x = 0; x < width; x++) {
			let tile = document.createElement('img');
			tile.setAttribute('id', `map${x}_${y}`);
			tile.setAttribute('src', 'img/plain/bare0.png');
			tile.setAttribute('alt', 'map_plain.png');
			tile.addEventListener('click', function () { clickOnMapTile(this) })

			map.layout[y].push({
				id: `map${x}_${y}`,
				typeIndex: 0,
				discovered: false,
				ct: function () { changeTile(this.id, editor.currentElemMap) },
			});

			if (x == map.width / 2 && y == map.height / 2) {
				//set camp position and changing the tile
				map.layout[y][x].typeIndex = map.indexTable.camp;
				map.layout[y][x].discovered = true;
				tile.src = 'img/map_camp.png';
				tile.alt = 'map_camp.png';
				camp.mapPos = [x, y];
			}

			document.getElementById('map').appendChild(tile);
		}
		document.getElementById('map').appendChild(document.createElement('br'));
	}
}