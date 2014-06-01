//Randomize a array

function shuffle(o) { //v1.0
	for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

//Given a set of tiles in value, return it's names

function generate_img_name(arr) {
	var result = new Array();
	for (var i = 0; i < arr.length; i++) {
		var ind = Math.floor((arr[i] / 4));
		if (ind < 27 && ind % 9 == 4 && arr[i] % 4 == 3)
			result.push((ind) + "_red.png");
		else
			result.push((ind) + ".png");
	}
	return result;
}

//Give the remaining tiles on the hand and judge if it's ready
var goal, ct, isgoal;

function isReady(hand) {
	ct = new Array(34);
	for (var i = 0; i < 34; i++)
		ct[i] = 0;
	for (var i = 0; i < hand.length; i++)
		ct[Math.floor(hand[i] / 4)]++;
	goal = Math.floor(hand.length / 3);
	var ans = new Array();
	for (var i = 0; i < 34; i++)
		if (ct[i] < 4) {
			isgoal = 0;
			var ctt = ct.slice();
			ctt[i]++;
			mahjong_ready_dfs(0, ctt);
			if (isgoal) {
				ans.push("<img draggable='false' class='display_tile' src='img/mahjong_tiles/" + (i) + ".png'>");
			}
		}
	return ans;
}

function isRon(hand) {
	ct = new Array(34);
	for (var i = 0; i < 34; i++)
		ct[i] = 0;
	for (var i = 0; i < hand.length; i++)
		ct[Math.floor(hand[i] / 4)]++;
	goal = Math.floor(hand.length / 3);
	isgoal = 0;
	var ctt = ct.slice();
	mahjong_ready_dfs(0, ctt);
	if (isgoal) {
		return "Ron";
	}
	return "Not Ron";
}


function mahjong_ready_dfs(layer, ct) {
	if (layer == goal) {
		for (var i = 0; i < 34; i++)
			if (ct[i] == 2)
				isgoal = 1;
		return;
	}
	for (var i = 0; i < 34; i++) {
		if (ct[i] >= 3) {
			ct[i] -= 3;
			mahjong_ready_dfs(layer + 1, ct);
			ct[i] += 3;
		}
		if (i + 2 < 27 && ct[i] && ct[i + 1] && ct[i + 2] && Math.floor(i / 9) == Math.floor((i + 2) / 9)) {
			ct[i]--;
			ct[i + 1]--;
			ct[i + 2]--;
			mahjong_ready_dfs(layer + 1, ct);
			ct[i]++;
			ct[i + 1]++;
			ct[i + 2]++;
		}
	}
}

/* adapter to mahjong_judge */

/*
function Hand(){
	this.tiles=new Array;
	this.melds=new Array;
	this.dora=new Array;
	this.lastDraw=-1;
	this.ron=0;
	this.riichi=0;
	this.rinjan=0;
	this.ippatsu=0;
	this.haidei=0;
	this.chankan=0;
	this.houdei=0;
	this.dabururiichi=0;
	this.dealer=0;
	this.roundWind = 6912; //East
	this.ownWind = 6912; //East
}
*/

function translate(result) {
	for (var i = 0; i < result.yakuType.length; i++)
		if (translations[result.yakuType[i][0]])
			result.yakuType[i][0] = translations[result.yakuType[i][0]][2];
	result.limitName = translations[result.limitName][2];
}


function decode(x) {
	var ind = Math.floor(x / 4);
	return (ind << 8) + (ind < 27 && ind % 9 == 4 && x % 4 == 3);
}


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
