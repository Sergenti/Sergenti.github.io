function firstLetterToUpperCase(str) {
	let firstLetter = str.slice(0, 1).toUpperCase();
	let righthand = str.slice(1, str.length);
	return firstLetter + righthand;
}

function firstLetterToLowerCase(str) {
	let firstLetter = str.slice(0, 1).toLowerCase();
	let righthand = str.slice(1, str.length);
	return firstLetter + righthand;
}

function getPos(el) {
	// obviously from stackoverflow
	// yay readability
	for (var lx = 0, ly = 0;
		el != null;
		lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
	return { x: lx, y: ly };
}

function getTile(x, y) {
	let id = `map${x}_${y}`;
	return document.getElementById(id);
}

function getId(x, y, mode) {
	return `${mode}${x}_${y}`;
}

function getTileXYFromId(id) {
	let x = 0;
	//Extracts the x part from the id (camp0 -> 0, map4 -> 4)
	let lefthand = id.split('_')[0];
	for (let i = 0; i < lefthand.length; i++) {
		if (!isNaN(lefthand[i])) {//Find the first number in the string
			x = parseInt(lefthand.slice(i));//Assign it to x
			break;
		}
	}
	let y = parseInt(id.split('_')[1]);

	return { x: x, y: y };
}

function g(str, n) {
	return str + n;
}

function unlockHorizontalScrolling() {
	//Permits horizontal scrolling in the map;
	let mapDiv = document.getElementById('map');
	let mapWidth = map.width * tileSize;
	let mapHeight = map.height * tileSize;
	let scrollBarWidth = 0;

	mapDiv.style.width = `${mapWidth + scrollBarWidth}px`;
	mapDiv.style.height = `${mapHeight + scrollBarWidth}px`;
}

function scrollToTile(x, y, behavior = 'auto') {
	let tile = getTile(x, y);
	let sPos = getPos(tile);
	let sx = sPos.x + 32,
		sy = sPos.y + 32;
	let playarea = document.getElementById('playarea');
	let screenWidth = playarea.offsetWidth;
	let screenHeight = playarea.offsetHeight;

	if (behavior == 'auto') {
		/* jump to coordinate */
		playarea.scrollTop = sy - screenHeight / 2;
		playarea.scrollLeft = sx - screenWidth / 2 - document.getElementById('leftpanel').offsetWidth;
	} else if (behavior == 'linear') {
		/* linear scrolling 
		let duration = 500;//ms*/

	} else if (behavior == 'smooth') {
		let duration = 30; // frames
		const destPosPx = {
			x: sx - screenWidth / 2 - document.getElementById('leftpanel').offsetWidth,
			y: sy - screenHeight / 2,
		}
		const initialPosPx = {
			x: playarea.scrollLeft,
			y: playarea.scrollTop,
		}
		const interval = {
			x: destPosPx.x - initialPosPx.x,
			y: destPosPx.y - initialPosPx.y,
		}

		let t = 0;
		window.requestAnimationFrame(moveFrame)
		function moveFrame() {
			const lambda = t / duration;
			const m = EasingFunctions.easeInOutQuad(lambda);
			playarea.scrollLeft = initialPosPx.x + (m * interval.x);
			playarea.scrollTop = initialPosPx.y + (m * interval.y);

			if (t <= duration) {
				t++;
				window.requestAnimationFrame(moveFrame)
			}
		}
	} else {
		console.log(`scrollToTile: behavior '${behavior}' is not recognized.`);
	}

	//doesn't work inside a scrollable element, only in window.
	//will have to implement smooth scrolling
	//window.scrollTo({ left: sx - screenWidth / 2, top: sy - screenHeight / 2, behavior: behavior });
}

function getNameFromIdMap(id) {
	let destPos = getTileXYFromId(id);
	let typeIndex = map.layout[destPos.y][destPos.y].typeIndex;
	let destName = map.layoutTiles[typeIndex].type;//Ultimately, to be replace with the name of the tile, if it should have one.
	return destName;
}
function getAdjacentTilesMap(id) {
	let adjacentTiles = [];
	let tilePos = getTileXYFromId(id);
	for (let y = -1; y < 2; y++) {//Y
		let ty = Number(tilePos.y) + y;
		for (let x = -1; x < 2; x++) {//X
			let tx = Number(tilePos.x) + x;
			if (tx >= 0 && ty >= 0 && tx < map.width && ty < map.height && !(x == 0 && y == 0)) {
				adjacentTiles.push(map.layout[ty][tx]);
			}
		}
	}
	return adjacentTiles;
}
function getDirectAdjacentTilesMap(id) {//Only the tiles that are directly adjacent to the tile. -> doesn't count the corners
	//RETURNS OUT OF BOUNDS TILES AS UNDEFINED
	let adjacentTiles = [];
	let tilePos = getTileXYFromId(id);

	for (let y = -1; y <= 1; y++) {
		let dy = Number(tilePos.y) + y;
		for (let x = -1; x <= 1; x++) {
			let dx = Number(tilePos.x) + x;
			if (xor(Math.abs(x) == 1, Math.abs(y) == 1) && !(x == 0 && y == 0)) {
				if (dx > map.width || dy > map.height || dx < 0 || dy < 0) {
					adjacentTiles.push(undefined);
				} else {
					adjacentTiles.push(map.layout[dy][dx]);
				}
			}
		}
	}
	return adjacentTiles;
}
function hasAdjacentTypeMap(id, type) {
	let adjW = false;
	let adjTiles = getDirectAdjacentTilesMap(id);
	for (let i = 0; i < adjTiles.length; i++) {
		if (adjTiles[i].type == type) {//Type of tile == type (e.g. 'water', 'city', ...)
			adjW = true;
			break;
		}
	}
	return adjW;
}
function moveElementOnTileMap(el, id) {//el: element to move, id: id of destination tile
	let pos = getPos(document.getElementById(id));
	//console.log({moveElementOnTileMap: pos});
	el.style.left = pos.x - document.getElementById('leftpanel').offsetWidth + 'px';//Correction because of the left panel
	el.style.top = pos.y + 'px';
}
function moveElementOnTileMapSmooth(el, id, duration = 40) {
	let pos = getPos(document.getElementById(id));
	const destPosPx = {
		x: pos.x - document.getElementById('leftpanel').offsetWidth,
		y: pos.y,
	}
	const initialPosPx = {
		x: getPos(el).x - document.getElementById('leftpanel').offsetWidth,
		y: getPos(el).y,
	}
	const interval = {
		x: destPosPx.x - initialPosPx.x,
		y: destPosPx.y - initialPosPx.y,
	}

	let t = 0;
	window.requestAnimationFrame(moveFrame)
	function moveFrame() {
		const lambda = t / duration;
		const m = EasingFunctions.easeInOutQuad(lambda);
		el.style.left = initialPosPx.x + (m * interval.x) + 'px';//Correction because of the left panel
		el.style.top = initialPosPx.y + (m * interval.y) + 'px';

		if (t <= duration) {
			t++;
			window.requestAnimationFrame(moveFrame)
		}
	}
}
function generateList(...list) {//List: array of strings
	let str = '';
	list.forEach(function (el, i, arr) {
		if (i < arr.length - 2) {
			str += el + ', ';
		} else if (i == arr.length - 2) {
			str += el + ' and ';
		} else {
			str += el;
		}
	});
	return str;
}
function generateResourceChangeList(loot) {
	let str = '(';
	loot.items.forEach((item, i, arr) => {
		str += `${addSign(item.qty)} ${item.name}`;
		if (i < arr.length - 1) {
			str += ' ';
		} else if (i == arr.length - 1) {
			str += ')'
		}
	});
	return str;
}
function createButton(value, targetParent, handler, disabled = false) {
	let o = document.createElement('input');
	o.setAttribute('type', 'button');
	o.setAttribute('value', value);
	o.addEventListener('click', handler);
	/* event listener for general properties of buttons (eg. clicksounds)*/
	o.addEventListener('click', function () { if (sounds.enabled) { sounds.click.play() } });
	o.disabled = disabled;
	targetParent.appendChild(o);
}
function addSign(number) {
	let v;
	if (number >= 0) {
		v = '+' + number;
	} else {
		v = number;
	}
	return v;
}
function onReady(callback) {
	/* from https://stackoverflow.com/questions/25253391/javascript-loading-screen-while-page-loads modified*/
	var intervalId = window.setInterval(function () {
		if (document.body !== undefined) {
			window.clearInterval(intervalId);
			callback.call(this);
		}
	}, 500);//refresh rate
}
function selectRandomFromArray(array) {
	let i = rand(0, array.length - 1);
	return array[i];
}

//Maths
function rand(min = 0, max = 1) {
	return Math.round(Math.random() * (max - min)) + min;
}

function xor(a, b) {//xor logical operator. return true or false
	return (a && !b) || (!a && b);
}

function manhattanDistance(x1, y1, x2, y2) {
	return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

function toKM(distance) {//takes arithmetical distance (distance from getDistanceToCamp)
	let multiplier = 250; // height or width of one map tile in KM
	return Math.round(distance * multiplier);
}

function getDistanceToCamp(id) {
	let pos = getTileXYFromId(id);
	let x = pos.y,
		y = pos.y,
		xCamp = player.campPos.x,
		yCamp = player.campPos.y;
	return getDistance(x, y, xCamp, yCamp)
}

function getDistance(x1, y1, x2, y2) {
	return Math.floor(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)));
}

function mapIntervals(value, startInterval, endInterval) {
	return (value - startInterval[0]) * (endInterval[1] - endInterval[0]) / (startInterval[1] - startInterval[0]) + endInterval[0];
}
function randNormal(min = 0, max = 1, mean = ((max + min) / 2), samples = 10) {
	// max/2 gives us the mean for an uniform CLT random number
	let r = mean + (randCLT(min, max, samples) - max / 2);
	if (r > max) {
		r = max;
	} else if (r < min) {
		r = min;
	}
	return r;

	function randCLT(min = 0, max = 1, samples = 10) {
		/* centered normal distribution using Central Limit Theorem */
		let randomNumbers = new Array(samples).fill(0).map(() => rand(min, max));
		return Math.round(randomNumbers.reduce((t, n) => t += n, 0) / samples);
	}
}

/* remove elements (from: https://stackoverflow.com/questions/3387427/remove-element-by-id) */
Element.prototype.remove = function () {
	this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
	for (var i = this.length - 1; i >= 0; i--) {
		if (this[i] && this[i].parentElement) {
			this[i].parentElement.removeChild(this[i]);
		}
	}
}