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
	return 4 - getRelative(x, y);
}

function decode(x) {
	var ind = Math.floor(x / 4);
	return (ind << 8) + (ind < 27 && ind % 9 == 4 && x % 4 == 3);
}

function translate(result) {
	for (var i = 0; i < result.yakuType.length; i++)
		if (translations[result.yakuType[i][0]])
			result.yakuType[i][0] = translations[result.yakuType[i][0]][2];
	result.limitName = translations[result.limitName][2];
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
	//debugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebug*/
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
	console.log(cmd);
	this.current_state = cmd.type;
	if (cmd.type == "tsumo") {
		return this.tsumo(cmd);
	} else if (cmd.type == "dahai") {
		return this.dahai(cmd);
	} else if (cmd.type == "chi") {
		return this.chi(cmd);
	} else if (cmd.type == "pon") {
		return this.pon(cmd);
	} else if (cmd.type == "kan") {
		this.kan(cmd);
	} else if (cmd.type == "ckan") {
		return this.ckan(cmd);
	}
};

/*
dahai
*/
JMJTable.prototype.dahai = function(cmd) {
	this.players[cmd.actor].discardTile(cmd.pai); //discade tile
	this.players[cmd.actor].dahai.push(cmd.pai); //add to dahai
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
};

/*
http://gimite.net/mjai/samples/sample.mjson.html
please forword this
*/
