/*
Some important constants here
*/
const INIT_POINT = 25000;
const TOTAL_TILES = 136;

/*
Some utilty function
*/
var cmp = function(a, b) {
	return a - b
};

function abs(x) {
	return x > 0 ? x : -x;
}

function getRelative(x, y) { //x see y
	return y - x >= 0 ? y - x : y - x + 4;
}

function getRelativeWind(x, y) { //x see y
	return (4 - getRelative(x, y)) % 4;
}

function changeToRelative(cmd) {
	var result = new Array();
	for (var i = 0; i < 4; i++) {
		var state = JSON.parse(JSON.stringify(cmd));
		state.actor = getRelative(i, cmd.actor);
		state.target = getRelative(i, cmd.target);
		result.push(state);
	}
	return result;
}

function decode(x) {
	var ind = Math.floor(x / 4);
	return (ind << 8) + (ind < 27 && ind % 9 == 4 && x % 4 == 3);
}

function translate(result) {
	for (var i = 0; i < result.yakuType.length; i++)
		if (translations[result.yakuType[i][0]]) {
			if (translations[result.yakuType[i][0]][0])
				result.yakuType[i].push(translations[result.yakuType[i][0]][0]);
			result.yakuType[i][0] = translations[result.yakuType[i][0]][2];
		}
	var temp = [translations[result.limitName][2], translations[result.limitName][0]];
	result.limitName = temp;
}


/*
JMJHand
*/

function JMJHand() {
	this.hand = new Hand();
	this.undecoded_hand = new Array();
}

JMJHand.prototype.addTile = function(tile) {
	this.hand.add(decode(tile));
	this.undecoded_hand.push(tile);
};

JMJHand.prototype.addMeld = function(type, cards) {
	cards.sort(cmp);
	for (var i = 0; i < cards.length; i++)
		cards[i] = decode(cards[i]);
	this.hand.melds.push([type, cards[0], cards]);
};

JMJHand.prototype.addDora = function(tile) {
	this.hand.dora.push(decode(tile));
};

JMJHand.prototype.removeTile = function(tile) {
	this.hand.tiles.remove(decode(tile));
	this.hand.lastDraw = -1;
	this.undecoded_hand.remove(tile);
}

JMJHand.prototype.isReady = function() {
	var result = this.hand.wait();
	return result.length > 0;
};

JMJHand.prototype.getReady = function() {
	var result = this.hand.wait();
	var simplify = new Array();
	for (var i = 0; i < result.length; i++)
		simplify.push(result[i][0]);
	return simplify;
};


JMJHand.prototype.judge = function() {
	var combinations = this.hand.valid();
	var h = this.hand;
	var result = {
		point: 0,
		fu: 0,
		yaku: 0,
		yakuman: 0,
		yakuType: new Array(),
		limitName: ""
	};
	for (var i = 0; i < combinations.length; i++) {
		var c = combinations[i];

		var fuCalc = calculateFu(c, h);
		var yakuCalc = calculateYaku(c, h);

		var yakumanCount = yakuCalc[0] < 0 ? -yakuCalc[0] : 0;

		var calculatedHandValue = yakumanCount ?
			8000 * yakumanCount :
			fuCalc[0] * (1 << (yakuCalc[0] + 2));

		var handValue = calculatedHandValue;
		var limitName = ""; /* limit name is the rough */

		if (yakuCalc[0] < -3) limitName = "SUPER YAKUMAN";
		else if (yakuCalc[0] == -3) limitName = "TRIPLE YAKUMAN";
		else if (yakuCalc[0] == -2) limitName = "DOUBLE YAKUMAN";
		else if (yakuCalc[0] == -1) limitName = "YAKUMAN";
		else if (yakuCalc[0] < 6 && handValue > 2000) handValue = 2000, limitName = "MANGAN";
		else if (yakuCalc[0] < 8 && handValue > 3000) handValue = 3000, limitName = "HANEMAN";
		else if (yakuCalc[0] < 11 && handValue > 4000) handValue = 4000, limitName = "BAIMAN";
		else if (yakuCalc[0] < 13 && handValue > 6000) handValue = 6000, limitName = "SANBAIMAN";
		else if (yakuCalc[0] >= 13 && handValue > 8000) handValue = 8000, limitName = "KAZOE-YAKUMAN";

		var payoff = handValue * (h.dealer ? 6 : 4);

		if (handValue > result.point) {
			result.point = handValue;
			result.fu = fuCalc[0];
			result.yaku = yakuCalc[0];
			result.yakuman = yakumanCount;
			for (var i = 0; i < yakuCalc[1].length; i++)
				result.yakuType.push([yakuCalc[1][i][0], yakuCalc[1][i][1]]);
			result.limitName = limitName;
		}
	}
	translate(result);
	return result;
}

/*
JMJPool - where all tiles from
*/

function JMJTilePool(tile_size) {
	this.pool = new Array();
	for (var i = 0; i < tile_size; i++)
		this.pool.push(i);
	//debugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebug
	//this.pool.shuffle();
	//debugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebug
}

JMJTilePool.prototype.getTile = function() {
	return this.pool.shift();
};

/*
JMJPlayer - it contains the information of a player in real game
*/

function JMJPlayer() {
	this.hand;
	this.point = INIT_POINT;
	this.round;
	this.dahai;
}

JMJPlayer.prototype.addTile = function(tile) {
	this.hand.addTile(tile);
};

JMJPlayer.prototype.discardTile = function(tile) {
	this.hand.removeTile(tile);
};

JMJPlayer.prototype.getNewHand = function() {
	this.hand = new JMJHand();
	this.dahai = new Array();
	this.round = 0;
};

JMJPlayer.prototype.getCanDo_dahai = function(tile, chiEn) {
	var canDo = new Array();
	if (this.canPon(tile)) {
		canDo.push("pon");
	}
	if (chiEn && this.canChi(tile)) {
		canDo.push("chi");
	}
	if (this.canKan(tile)) {
		canDo.push("kan");
	}
	if (this.canRon(tile)) {
		canDo.push("ron");
	}
	return canDo;
}

JMJPlayer.prototype.getCanDo_tsumo = function(tile, en) {
	var canDo = new Array();
	if (en) {
		if (this.canCkan()) {
			canDo.push("ckan");
		}
		if (this.canTsumo()) {
			canDo.push("tsumo");
		}
		if (this.canRiichi()) {
			canDo.push("riichi");
		}
	}
	return canDo;
}

JMJPlayer.prototype.canPon = function(tile) {
	var tiles = this.hand.hand.tiles;

	var ct = 0;
	for (var i = 0; i < tiles.length; i++)
		if ((tiles[i] >> 8) == (tile >> 2))
			ct++;
	return ct >= 2;
}

JMJPlayer.prototype.canChi = function(tile) {
	var tiles = this.hand.hand.tiles;


	for (var i = 0; i < tiles.length - 1; i++) {
		var cards = [tiles[i] >> 8, tiles[i + 1] >> 8, tile >> 2];
		cards.sort(cmp);
		if (cards[2] < 27 && (cards[0] % 9 < cards[2] % 9) && cards[0] + 1 == cards[1] && cards[1] + 1 == cards[2])
			return true;
	}
	return false;
}

JMJPlayer.prototype.canKan = function(tile) {
	var tiles = this.hand.hand.tiles;

	var ct = 0;
	for (var i = 0; i < tiles.length; i++)
		if ((tiles[i] >> 8) == (tile >> 2))
			ct++;
	return ct >= 2;
}

JMJPlayer.prototype.canCkan = function() {
	var len = 1;
	var tiles = this.hand.hand.tiles;
	for (var i = 1; i < tiles.length; i++)
		if (tiles[i] == tiles[i - len])
			len++;
	return len >= 4;
}

JMJPlayer.prototype.canRon = function(tile) {
	this.addTile(tile);
	var result = this.hand.judge();
	this.discardTile(tile);
	console.log(result);
	return result.point > 0;
}

JMJPlayer.prototype.canTsumo = function() {
	return this.hand.judge().point > 0;
}

JMJPlayer.prototype.canRiichi = function() {
	var hand = this.hand;
	if (hand.hand.tiles.length == 14) {
		for (var i = 0; i < hand.hand.tiles.length; i++) {
			var hand_copy = jQuery.extend(true, {}, hand); // copy object

			hand_copy.hand.tiles.remove(hand.hand.tiles[i]); // delete one card

			if (hand_copy.isReady()) // check is ready after deleting one card
				return true;
		}
	}
	return false;
}

/*
JMJProtocal - for server to client and client to server communication
*/

function JMJProtocal() {
	this.type = "";
}

/*
JMJTable - the top module of JMJ

it has 4 JMJPlayers
*/

function JMJTable() {
	this.players = new Array();
	for (var i = 0; i < 4; i++)
		this.players[i] = new JMJPlayer();
	this.doras;
	this.tile_remain;
	this.tile_pool;
	this.current_player;
	this.dealer_player = 0;
	this.crrent_state;

	this.round = 1; //1~4
	this.wind = 0; // 0~3

}

JMJTable.prototype.initGame = function() {
	this.tile_remain = TOTAL_TILES; //tiles ard indexed from 0 to 135
	this.current_player = this.dealer_player; //dealer first
	this.tile_pool = new JMJTilePool(TOTAL_TILES); // get a new tile pool
	this.doras = new Array(); // new empty dora array

	this.current_state = "start"

	for (var i = 0; i < 4; i++)
		this.players[i].getNewHand(); //refresh players' hands

	for (var i = 0; i < 4; i++) {
		this.players[i].hand.hand.ownWind = (WIND_EAST + getRelativeWind(i, this.dealer_player)) << 8;
		for (var j = 0; j < 13; j++)
			this.players[i].addTile(this.getTile()); //disturibute tile
	}

	this.addDora(this.getTile()); //the initial dora

	var result = new Array();

	for (var i = 0; i < 4; i++) {
		var state = new JMJProtocal();
		state.type = this.current_state;
		state.round = this.round;
		state.wind = this.wind;
		state.ownWind = getRelativeWind(i, this.dealer_player);
		state.dora = this.doras[0];
		state.point = this.players[i].point;

		state.hand = this.players[i].hand.undecoded_hand.slice();
		state.hand.sort(cmp);

		result.push(state);
	}
	return result;
};

JMJTable.prototype.getTile = function() {
	this.tile_remain--;
	return this.tile_pool.getTile();
};

JMJTable.prototype.addDora = function(tile) {
	this.doras.push(tile);
	for (var i = 0; i < 4; i++)
		this.players[i].hand.addDora(tile);
}

JMJTable.prototype.exec = function(command) {

	var cmd = JSON.parse(command); // turn the json string to js object
	var result;
	console.log(cmd);
	this.current_state = cmd.type;
	if (cmd.type == "tsumo") {
		result = this.tsumo(cmd);
	} else if (cmd.type == "dahai") {
		result = this.dahai(cmd);
	} else if (cmd.type == "chi") {
		result = this.chi(cmd);
	} else if (cmd.type == "pon") {
		result = this.pon(cmd);
	} else if (cmd.type == "kan") {
		result = this.kan(cmd);
	} else if (cmd.type == "ckan") {
		result = this.ckan(cmd);
	} else if (cmd.type == "ron") {
		result = this.ron(cmd);
	}

	if (result) {
		for (var i = 0; i < 4; i++) {
			if (this.current_state == "dahai") {
				result[i].canDo = this.players[i].getCanDo_dahai(cmd.pai, (i == (cmd.actor + 1) % 4) ? 1 : 0);
			} else if (this.current_state == "tsumo") {
				result[i].canDo = this.players[i].getCanDo_tsumo(cmd.pai, (i == (cmd.actor) % 4) ? 1 : 0);
			}
		}
	}

	return result;
};

/*
dahai
*/
JMJTable.prototype.dahai = function(cmd) {
	this.players[cmd.actor].discardTile(cmd.pai); //discade tile
	this.players[cmd.actor].dahai.push(cmd.pai); //add to dahai

	var result = new Array();

	for (var i = 0; i < 4; i++) {
		var state = new JMJProtocal();
		state.type = this.current_state;
		state.pai = cmd.pai;
		state.actor = getRelative(i, cmd.actor);

		result.push(state);
	}

	return result;
};

/*
tsumo
*/
JMJTable.prototype.tsumo = function(cmd) {
	var pai = this.getTile();
	this.players[cmd.actor].addTile(pai);

	var result = new Array();

	for (var i = 0; i < 4; i++) {
		var state = new JMJProtocal();
		state.type = this.current_state;
		state.pai = (i == cmd.actor) ? pai : -1;
		state.actor = getRelative(i, cmd.actor);

		result.push(state);
	}

	return result;
};

/*
chi
*/
JMJTable.prototype.chi = function(cmd) {
	for (var i = 0; i < cmd.consumed.length; i++) {
		this.players[cmd.actor].hand.removeTile(cmd.consumed[i]);
	}
	const CHII = (2 << 8);

	var cards = cmd.consumed.concat([cmd.pai]); //join the meld
	this.players[cmd.actor].hand.addMeld(CHII, cards); // add meld to hand

	return changeToRelative(cmd);
};

/*
pon
*/
JMJTable.prototype.pon = function(cmd) {
	for (var i = 0; i < cmd.consumed.length; i++) {
		this.players[cmd.actor].hand.removeTile(cmd.consumed[i]);
	}

	const PON = (3 << 8);

	var cards = cmd.consumed.concat([cmd.pai]); //join the meld
	this.players[cmd.actor].hand.addMeld(PON, cards); // add meld to hand

	return changeToRelative(cmd);
};

/*
kan
*/
JMJTable.prototype.kan = function(cmd) {
	for (var i = 0; i < cmd.consumed.length; i++) {
		this.players[cmd.actor].hand.removeTile(cmd.consumed[i]);
	}

	const KAN = (4 << 8);

	var cards = cmd.consumed.concat([cmd.pai]); //join the meld
	this.players[cmd.actor].hand.addMeld(KAN, cards); // add meld to hand

	return changeToRelative(cmd);
};

/*
ckan
*/
JMJTable.prototype.ckan = function(cmd) {
	for (var i = 0; i < cmd.consumed.length; i++) {
		this.players[cmd.actor].hand.removeTile(cmd.consumed[i]);
	}

	const CKAN = (4 << 8) + 2;

	var cards = cmd.consumed.concat([cmd.pai]); //join the meld
	this.players[cmd.actor].hand.addMeld(CKAN, cards); // add meld to hand

	return changeToRelative(cmd);
};

/*
ron
*/
JMJTable.prototype.ron = function(cmd) {
	var hand = this.players[cmd.actor].hand;
	this.players[cmd.actor].addTile(cmd.pai);
	this.setHandProperty(hand.hand, cmd);

	return this.ronJudgeResult(hand, cmd);
};

JMJTable.prototype.setHandProperty = function(hand, cmd) {
	hand.ron = cmd.actor != cmd.target;
	hand.riichi = 0;
	hand.rinjan = 0;
	hand.ippatsu = 0;
	hand.haidei = 0;
	hand.chankan = 0;
	hand.houdei = 0;
	hand.dabururiichi = 0;
	hand.dealer = cmd.actor == this.dealer_player;
};

JMJTable.prototype.ronJudgeResult = function(hand, cmd) {
	var judgeResult = hand.judge();
	var basicPoint = judgeResult.point;

	var delta = [0, 0, 0, 0];
	var points = new Array();

	if (cmd.actor == cmd.target) { // tsumo
		for (var i = 0; i < 4; i++) {
			if (cmd.actor == this.dealer_player || i == this.dealer_player) {
				point = roundToHundred(basicPoint * 2);
			} else {
				point = roundToHundred(basicPoint * 1);
			}
			delta[cmd.actor] += point;
			delta[i] -= point;
		}
	} else { // ron
		var point;
		if (cmd.actor == this.dealer_player || cmd.target == this.dealer_player) {
			point = roundToHundred(basicPoint * 6);
		} else {
			point = roundToHundred(basicPoint * 4);
		}
		delta[cmd.actor] += point;
		delta[cmd.target] -= point;
	}

	for (var i = 0; i < 4; i++) {
		this.players[i].point += delta[i];
		points.push(this.players[i].point)
	}

	var result = new Array();
	for (var i = 0; i < 4; i++) {
		var state = new JMJProtocal();
		state.type = "ronResult";
		state.result = judgeResult;
		state.points = new Array(4);
		state.deltas = new Array(4);
		for (var j = 0; j < 4; j++) {
			state.points[getRelative(i, j)] = points[j];
			state.deltas[getRelative(i, j)] = delta[j];
		}
		result.push(state);
	}

	return result;
};
/*
http://gimite.net/mjai/samples/sample.mjson.html
please forword this
*/
