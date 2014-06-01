/*
Some important constants here
*/
const INIT_POINT = 25000;
const TOTAL_TILES = 136;

/*
Some utilty function
*/

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
}

JMJHand.prototype.addTile = function(tile) {
	this.hand.add(decode(tile));
};

JMJHand.prototype.addMeld = function() {
	// TODO
};

JMJHand.prototype.addDora = function(tile) {
	this.hand.dora.push(decode(tile));
};

JMJHand.prototype.removeTile = function(tile) {
	this.hand.tiles.remove(decode(tile));
	this.hand.lastDraw = -1;
}

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
	this.pool.shuffle();
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
}

JMJPlayer.prototype.addTile = function(tile) {
	this.hand.addTile(tile);
};

JMJPlayer.prototype.discardTile = function(tile) {
	this.hand.removeTile(tile);
};

JMJPlayer.prototype.getNewHand = function() {
	this.hand = new JMJHand();
	this.round = 0;
};
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
}

JMJTable.prototype.initGame = function() {
	this.tile_remain = TOTAL_TILES; //tiles ard indexed from 0 to 135
	this.current_player = this.dealer_player; //dealer first
	this.tile_pool = new JMJTilePool(TOTAL_TILES); // get a new tile pool
	this.doras = new Array(); // new empty dora array

	for (var i = 0; i < 4; i++)
		this.players[i].getNewHand(); //refresh players' hands

	for (var i = 0; i < 4; i++)
		for (var j = 0; j < 13; j++)
			this.players[i].addTile(this.getTile()); //disturibute tile

	this.addDora(this.getTile()); //the initial dora
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

/*
http://gimite.net/mjai/samples/sample.mjson.html
please forword this
*/