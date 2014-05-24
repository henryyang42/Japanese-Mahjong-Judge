#<center>JMJ SPEC</center>
---

##data structure
    
- Japanese Mahjong has 34 different kinds of tiles plus 3 read doras, 4 for each, 136 tiles in total. Therefore, for simpilicity, all different tiles are labled from 0 to 33 as below.

![alt text](http://dl.dropboxusercontent.com/u/113630504/Web/Web_Final_JMJ/img/file.png "File structure")

- Note that for each tile there are 4 same ones, in our algorithm, we use 0 to 135 to represent each tile. And they are easily convert back into 0 ~ 34 using folling code.

``` javascript
var ind = Math.floor(x / 4); //convert back into 0~33
var isRed = (ind < 27 && ind % 9 == 4 && x % 4 == 3); //judge if it's red

```
---
##API - JMJHand
####JMJHand handles all judgements in the game including the score calculation and provide well abstraction to complex data structure

### Hand
JMJHand are derived from hand, which has several important elements

``` javascript
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

function JMJHand(){
	this.hand = new Hand();
}

```

### JMJHand.addTile
Push a tile into the hand

``` javascript
JMJHand.prototype.addTile = function(tile) {
	this.hand.add(decode(tile));
};
```

###JMJHand.addMeld
Yet to be determined

``` javascript
JMJHand.prototype.addMeld = function() {
	// TODO
};
```

###JMJHand.removeTile
Remove a tile from hand.

``` javascript
JMJHand.prototype.removeTile = function(tile) {
	this.hand.tiles.remove(decode(tile));
	this.hand.lastDraw = -1;
}
```

###JMJHand.judge
Judge current state and return it's point and other details

``` javascript
JMJHand.prototype.judge = function() {
	var combinations = this.hand.valid();
	var h = this.hand;
	var result = {point: 0, fu:0 , yaku: 0, yakuman: 0, yakuType: new Array(), limitName: ""};
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

			if(calculatedHandValue > result.point){
				result.point = handValue;
				result.fu = fuCalc[0];
				result.yaku = yakuCalc[0];
				result.yakuman = yakumanCount;
				for(var i = 0; i < yakuCalc[1].length; i++)
					result.yakuType.push([yakuCalc[1][i][0], yakuCalc[1][i][1]]);
				result.limitName = limitName;
			}
		}
	translate(result);
	return result;
}
```

###Usage
Below is an example that impliments a 九蓮宝燈九面待ち

``` javascript
var hand = new JMJHand();

hand.addTile(0); //1m
hand.addTile(1); //1m
hand.addTile(2); //1m
hand.addTile(4); //2m
hand.addTile(8); //3m
hand.addTile(12); //4m
hand.addTile(16); //5m
hand.addTile(20); //6m
hand.addTile(25); //7m
hand.addTile(28); //8m
hand.addTile(32); //9m
hand.addTile(33); //9m
hand.addTile(34); //9m (ready for 123456789m)
hand.addTile(35); //9m (win)

var result = hand.judge(); //get the calculated result
JSON.stringify(result); //{"point":16000,"fu":30,"yaku":-2,"yakuman":2,"yakuType":[["九蓮宝燈九面待ち",-2]],"limitName":"ダブル役満"}

```

