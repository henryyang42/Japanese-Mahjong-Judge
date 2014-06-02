/*
 * Copyright (c) 2009 Andrey Osenenko
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */

/*
 * This is a very early release, and is probably buggy. Use at your own risk.
 * (in case you skipped the part of license written in large letters)
 */

/*

 *** 0.1 ***

 * Initial release

 *** 0.2 ***

 * Changed limits and yaku names to wiki page (apparently
   http://www.ofb.net/~whuang/ugcs/gp/mahjong/mahjong.html is out of date)

 * Added sounds ripped from SakiJan game (guess where I got tiles from?)

*/

var debug = 1;

const TILE_WIDTH				= 39;
const TILE_HEIGHT				= 60;

const TILE_BASE_SPEED			= 25;
const TILE_SPEED_BONUS			= 2500;
const TILE_SPEED_BONUS_RANGE	= 300;

const MAN		= 0;
const PIN		= 1;
const SOU		= 2;
const KAZE		= 3;
const SANGEN	= 4;

const RED		= (1<<0);
const CLOSED	= (1<<1);

const MELD_MASK		= (0x7<<8);
const PAIR			= (1<<8);
const CHII			= (2<<8);
const PON			= (3<<8);
const KAN			= (4<<8);
const CKAN 			= (4<<8)+2; 			
const KOKUSHI_MUSOU = (5<<8);

const CHARACTERS	= 0;
const CIRCLES		= 1;
const BAMBOOS		= 2;
const HONORS		= 3;

const WAIT_NONE			= 0;
const WAIT_TWO_SIDED	= 1;
const WAIT_CENTRAL		= 2;
const WAIT_EDGE			= 3;
const WAIT_HANGING		= 4;
const WAIT_DOUBLEPON	= 5;

const WIND_EAST			= 27;
const WIND_SOUTH		= 28;
const WIND_WEST			= 29;
const WIND_NORTH		= 30;

/* Special tiles used for visual purposes only */
const TILE_WHITESPACE	= (34<<8);
const TILE_HALFSPACE	= (35<<8);


var tiles=[
	"ONE OF CHARACTERS",
	"TWO OF CHARACTERS",
	"THREE OF CHARACTERS",
	"FOUR OF CHARACTERS",
	"FIVE OF CHARACTERS",
	"SIX OF CHARACTERS",
	"SEVEN OF CHARACTERS",
	"EIGHT OF CHARACTERS",
	"NINE OF CHARACTERS",
	
	"ONE OF CIRCLES",
	"TWO OF CIRCLES",
	"THREE OF CIRCLES",
	"FOUR OF CIRCLES",
	"FIVE OF CIRCLES",
	"SIX OF CIRCLES",
	"SEVEN OF CIRCLES",
	"EIGHT OF CIRCLES",
	"NINE OF CIRCLES",
	
	"ONE OF BAMBOOS",
	"TWO OF BAMBOOS",
	"THREE OF BAMBOOS",
	"FOUR OF BAMBOOS",
	"FIVE OF BAMBOOS",
	"SIX OF BAMBOOS",
	"SEVEN OF BAMBOOS",
	"EIGHT OF BAMBOOS",
	"NINE OF BAMBOOS",
	
	"EAST WIND",
	"SOUTH WIND",
	"WEST WIND",
	"NORTH WIND",
	
	"WHITE DRAGON",
	"GREEN DRAGON",
	"RED DRAGON",
];

var numbers=[
	"ONE",
	"TWO",
	"THREE",
	"FOUR",
	"FIVE",
	"SIX",
	"SEVEN",
	"EIGHT",
	"NINE",
];

var suits=[
	"CHARACTERS",
	"CIRCLES",
	"BAMBOOS",
	"HONORS",
];

var waits=[
	"OTHER",
	"TWO SIDED",
	"CENTRAL",
	"EDGE",
	"HANGING",
	"DOUBLE PON",
];

const KOKUSHI_MUSOU_SEQ=[
	0,8,9,17,18,26,27,28,29,30,31,32,33
];
const CHUUREN_POOTOO=[
	1,1,1,2,3,4,5,6,7,8,9,9,9
];

const translations={

	                        /* YAKU */
                    "NO-POINTS HAND" : ["voice/y00.mp3","pinfu","平和"],
                       "ALL SIMPLES" : ["voice/y01.mp3","tan'yao","断么"],
    "ONE SET OF IDENTICAL SEQUENCES" : ["voice/y02.mp3","īpeikō","一盃口"],
                       "WHITE BOARD" : ["voice/y03.mp3","haku","白"],
                     "GREEN PROSPER" : ["voice/y04.mp3","hatsu","発"],
                        "RED MIDDLE" : ["voice/y05.mp3","chun","中"],
     "TERMINAL OR HONOR IN EACH SET" : ["voice/y08.mp3","chanta","チャンタ"],
          "ALL TERMINALS AND HONORS" : ["voice/y09.mp3","honrōtō","混老頭"],
             "THREE COLOUR STRAIGHT" : ["voice/y10.mp3","sanshoku","三色"],
                  "STRAIGHT THROUGH" : ["voice/y11.mp3","ittsū","一通"],
                  "ALL TRIPLET HAND" : ["voice/y12.mp3","toitoi","対々"],
             "THREE COLOUR TRIPLETS" : ["voice/y13.mp3","sanshoku doukō","三色同刻"],
          "THREE CONCEALED TRIPLETS" : ["voice/y14.mp3","san ankō","三暗刻"],
                       "THREE QUADS" : ["voice/y15.mp3","san kantsu","三槓子"],
             "LITTLE THREE ELEMENTS" : ["voice/y16.mp3","shōsangen","小三元"],
                       "SEVEN PAIRS" : ["voice/y17.mp3","chītoitsu","七対子"],
          "ONE SUIT TRIPLE SEQUENCE" : ["voice/y19.mp3","sanrenpon","???"],
   "TWO SETS OF IDENTICAL SEQUENCES" : ["voice/y20.mp3","ryanpeikō","二盃口"],
              "TERMINAL IN EACH SET" : ["voice/y21.mp3","junchan","純チャン"],
              "ONE SUIT PLUS HONORS" : ["voice/y22.mp3","hon'itsu","混一"],
                  "SINGLE SUIT HAND" : ["voice/y23.mp3","chin'itsu","清一"],
            "FOUR CONCEALED TRIPLES" : ["voice/y24.mp3","sū ankō ","四暗刻"],
  "FOUR CONCEALED TRIPLES PAIR WAIT" : ["voice/y25.mp3","sū ankō danchi","四暗刻単騎"],
                "BIG THREE ELEMENTS" : ["voice/y26.mp3","daisangen","大三元"],
                        "ALL HONORS" : ["voice/y27.mp3","tsūīsō","字一色"],
                 "LITTLE FOUR WINDS" : ["voice/y28.mp3","shōsūshī","小四喜"],
                    "BIG FOUR WINDS" : ["voice/y29.mp3","daisūshī","大四喜"],
                         "ALL GREEN" : ["voice/y30.mp3","ryūīsō","緑一色"],
                        "NINE GATES" : ["voice/y31.mp3","chūren pōtō","九蓮宝燈"],
              "NINE GATES NINE WAIT" : ["voice/y32.mp3","chūren pōtō kyumen machi","九蓮宝燈九面待ち"],
                     "ALL TERMINALS" : ["voice/y33.mp3","chinrōtō","清老頭"],
                        "FOUR QUADS" : ["voice/y34.mp3","sū kantsu","四槓子"],
                       "THE CHARIOT" : ["voice/y36.mp3","daisharin","大車輪"],
                  "THIRTEEN ORPHANS" : ["voice/y37.mp3","kokushi musō","国士無双"],
    "THIRTEEN ORPHANS THIRTEEN WAIT" : ["voice/y38.mp3","kokushi musō jūsanmen machi","国士無双十三面待ち"],
                              "DORA" : ["voice/y39.mp3","dora","ドラ"],
                        "READY HAND" : ["voice/y44.mp3","rīchi","リーチ"],
                      "DOUBLE-READY" : ["voice/y45.mp3","daburu rīchi","ダブルリーチ"],
                          "ONE-SHOT" : ["voice/y46.mp3","ippatsu","一発"],
                         "SELF PICK" : ["voice/y47.mp3","tsumo","ツモ"],
"GOING OUT ON A SUPPLEMENTAL TILE FROM THE DEAD WALL" : ["voice/y48.mp3","rinshan kaihō","嶺上開花"],
          "ROBBING A QUAD TO GO OUT" : ["voice/y49.mp3","chankan","搶槓,槍槓"],
           "LAST TILE FROM THE WALL" : ["voice/y50.mp3","haitei","海底"],
   "LAST TILE FROM THE WALL DISCARD" : ["voice/y51.mp3","hōtei","河底"],
                            "HEAVEN" : ["voice/y52.mp3","tenhou","天和"],
                             "EARTH" : ["voice/y53.mp3","chiihou","地和"],
                               "MAN" : ["voice/y54.mp3","renhou","人和"],
                "13 UNRELATED TILES" : ["voice/y56.mp3","shisanpuuta","十三不靠"],
                      "END DISCARDS" : ["voice/y57.mp3","nagashi mankan","流し満貫"],
                     "SPECIAL TILES" : ["","yakuhai, huanpai","役牌"],
                     "RED TILES"     : ["", "", "赤ドラ"],

	                      /* LIMITS */
                            "MANGAN" : ["voice/m01.mp3","mangan","満貫"],
                           "HANEMAN" : ["voice/m02.mp3","haneman","跳満"],
                            "BAIMAN" : ["voice/m03.mp3","baiman","倍満"],
                         "SANBAIMAN" : ["voice/m04.mp3","sanbaiman","三倍満"],
                     "KAZOE-YAKUMAN" : ["voice/m05.mp3","kazoe-yakuman","数え役満"],
                           "YAKUMAN" : ["voice/m06.mp3","yakuman","役満"],
                    "DOUBLE YAKUMAN" : ["voice/m07.mp3","daburu yakuman","ダブル役満"],
                    "TRIPLE YAKUMAN" : ["voice/m08.mp3","toripuru yakuman","トラブル役満"],
                     "SUPER YAKUMAN" : ["voice/m09.mp3","suupa yakuman","スーパー役満"],
                     			  "" : ["", "", ""]
};
/*if (yakuCalc[0] < -3) limitName = "SUPER YAKUMAN";
		else if (yakuCalc[0] == -3) limitName = "TRIPLE YAKUMAN";
		else if (yakuCalc[0] == -2) limitName = "DOUBLE YAKUMAN";
		else if (yakuCalc[0] == -1) limitName = "YAKUMAN";
		else if (yakuCalc[0] < 6 && handValue > 2000) handValue = 2000, limitName = "MANGAN";
		else if (yakuCalc[0] < 8 && handValue > 3000) handValue = 3000, limitName = "HANEMAN";
		else if (yakuCalc[0] < 11 && handValue > 4000) handValue = 4000, limitName = "BAIMAN";
		else if (yakuCalc[0] < 13 && handValue > 6000) handValue = 6000, limitName = "SANBAIMAN";
		else if (yakuCalc[0] >= 13 && handValue > 8000) handValue = 8000, limitName = "KAZOE-YAKUMAN";
*/
function e(n){return document.getElementById(n);}
function defined(x){return x!=undefined;}
function now(){return new Date().getTime()}
function capitalize(s){return s.substr(0,1).toUpperCase()+s.substr(1).toLowerCase()}
function lc(s){return s.toLowerCase()}
function uc(s){return s.toUpperCase()}
function plus(a,b){return a+b[1]}
function roundToHundred(v){return Math.ceil(v/100)*100};
function displayHan(v){return v==-1?"S":v==-2?"X":v};

Array.prototype.shuffle=function(){                                                           
	var i,L;                                                           
	i = L = this.length;                                               
	while (i--){
		var r = Math.floor(Math.random()*L);                               
		var x = this[i];                                                       
		this[i] = this[r];                                                       
		this[r] = x;                                                           
	}

	return this;
};

Array.prototype.remove=function(item){
	var i=0;
	while (i<this.length) {
		if (this[i]==item) {
			this.splice(i,1);
			return this;
		} else{
			i++;
		}
	}
	return this;
};
Array.prototype.removeOne=function(item){
	var i=0;
	while (i<this.length) {
		if (this[i]==item) {
			this.splice(i,1);
			return;
		} else{
			i++;
		}
	}
	return this;
};

Array.prototype.map=function(f){                                                           
	var list=[];                                                         
	
	for(var i=0;i<this.length;i++)
		list[i]=f(this[i]);

	return list;
};                                                                     

Array.prototype.fold=function(v,f){                                                           
	for(var i=0;i<this.length;i++)
		v=f(v,this[i]);

	return v;
};                                                                     

/* given tile code judge it's property */

function isEnd(code){
	var id=code>>8;
	
	if(id==0  || id==8)  return 1;
	if(id==9  || id==17) return 1;
	if(id==18 || id==26) return 1;

	return 0;
}
function isTerminal(code){
	var id=code>>8;
	
	if(isEnd(code)) 	 return 1;
	if(id>=27 && id<=33) return 1;

	return 0;
}
function isWind(code){
	var id=code>>8;
	
	if(id>=27 && id<=30) return 1;

	return 0;
}
function isColor(code){
	var id=code>>8;
	
	if(id>=31 && id<=33) return 1;

	return 0;
}
function isChar(code){
	return isColor(code) || isWind(code);
}
function isGreen(code){
	var id=code>>8;

	return id==19 || id==20 || id==21 || id==23 || id==25 || id==32;
}
function isSuit(code){
	return type(code)<27;
}


function makeSuit(suitno,no){
	if(no<1 || no>9 || suitno<0 || suitno>2) return -1;
	return (suitno*9+no-1)<<8;
}

function getDora(code){
	var t=type(code);
	var n=numberic(code);

	if(n>0 && n<9)	return ((t+1)<<8);
	if(n==9)		return ((t-8)<<8);

	if(t<30)		return ((t+1)<<8);
	if(t==30)		return ((t-3)<<8);

	if(t<33)		return ((t+1)<<8);
	if(t==33)		return ((t-2)<<8);

	return -1;
}

function tileIsNext(left,right){
	var l=left>>8;
	var r=right>>8;
	
	if(r!=l+1) return 0;
	if(l==8 || l==17 || l>=26) return 0;

	return 1;	
}

function describe(code){
	var id=code>>8;
	var res=tiles[id];
	
	if(code&RED) res="RED "+res;

	return res;
}

function describeMeld(list){
	var res;

	if((list[0]&MELD_MASK)==PAIR)	res="PAIR OF "+describe(list[1]);
	if((list[0]&MELD_MASK)==PON)	res="PON OF "+describe(list[1]);
	if((list[0]&MELD_MASK)==KAN)	res="KAN OF "+describe(list[1]);
	if((list[0]&MELD_MASK)==CHII)	res="CHII OF "+
		numbers[numberic(list[1])-1]+"-"+
		numbers[numberic(list[1])]+"-"+
		numbers[numberic(list[1])+1]+
		" OF "+suits[suit(list[1])];
	if((list[0]&MELD_MASK)==KOKUSHI_MUSOU)	return "KOKUSHI MUSOU";

	if(!res) return "UNK";

	if(!(list[0]&CLOSED)) res="OPEN "+res;

	return res;
}
function describeCombination(list){
	return list.map(describeMeld).join(", ");
}

function id(code){
	return "t"+(code>>8)+(code&1?"r":"");
}

function type(code){
	return code>>8;
}
function fromType(code){
	return code<<8;
}
function generalize(code){
	return code&0xffffff00;
}
function numberic(code){
	var id=code>>8;
	
	if(id<27) return 1+id%9;

	return 0;
}
function suit(code){
	var id=code>>8;

	if(id<9) return CHARACTERS;
	if(id<18) return CIRCLES;
	if(id<27) return BAMBOOS;
	
	return HONORS;
}

function Wall(){
	var a=new Array;
	
	for(var i=0;i<tiles.length;i++){
		var code=i<<8;

		a.push(code);a.push(code);a.push(code);
		
		if(numberic(code)==5) a.push(code|1);
		else a.push(code);
	}newMeld

	this.tiles=a.shuffle();
}

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

function handFromText(text){
	var tokens=text.match(/([psm][1-9]|c[rwg]|w[sewn])/gi);
	var hand=new Hand;

	for(var i=0;i<tokens.length;i++){
		var token=tokens[i].toLowerCase();
		var a=token[0],b=token[1];
		var res;
		
		     if(a=='p') res=8+parseInt(b);
		else if(a=='s') res=17+parseInt(b);
		else if(a=='m') res=-1+parseInt(b);
		else if(a=='w' && b=='e') res=27;
		else if(a=='w' && b=='s') res=28;
		else if(a=='w' && b=='w') res=29;
		else if(a=='w' && b=='n') res=30;
		else if(a=='c' && b=='w') res=31;
		else if(a=='c' && b=='g') res=32;
		else if(a=='c' && b=='r') res=33;
		else res=-1;

		hand.add(res<<8);
	}

	return hand;
}

Hand.prototype.toText=function(){
	
}

function ns(a,b){return a - b;}

Hand.prototype.draw=hand_draw;
function hand_draw(wall){
    this.tiles.push(wall.tiles.shift());
	this.tiles.sort(ns);
}

Hand.prototype.add=function(code){
    this.tiles.push(code);
	this.tiles.sort(ns);
	this.lastDraw = code;
}

Hand.prototype.copy=function(){
	var hand=new Hand;

	hand.tiles=this.tiles.slice();
	hand.melds=this.melds;
	
	return hand;
}

Hand.prototype.wait=function(){
	var wait=[];

	for(var i=0;i<tiles.length;i++){
		var code=i<<8;
		var hand=this.copy();

		hand.add(code);

		var com=hand.valid();
		if(com.length==0) continue;

		wait.push([code,com]);
	}

	return wait;
}

Hand.prototype.waitKind=function(code,combination){
	var tile=type(code);
	var kind=WAIT_NONE;

	for(var j=0;j<combination.length;j++){
		var m=combination[j];
		var mkind=m[0]&MELD_MASK;
		
		if(mkind==PAIR && type(m[1])==tile){kind=WAIT_HANGING;break;}

		if(!m[0]&CLOSED) continue;
		if(mkind==CHII && type(m[1])+1==tile){kind=WAIT_CENTRAL;break;}
		if(mkind==CHII && (type(m[1])==tile || type(m[1])+1==tile || type(m[1])+2==tile)){
			if(numberic(m[1])==1 && numberic(code)!=1){kind=WAIT_EDGE;break;}
			if(numberic(m[1])==7 && numberic(code)!=9){kind=WAIT_EDGE;break;}
			
			kind=WAIT_TWO_SIDED;
		}
		if(mkind==PON && type(m[1])==tile){kind=WAIT_DOUBLEPON;}
	}
	
	return kind;
}

Hand.prototype.valid=function(){
	var i;
	var list=this.valid_helper(0,0,0,this.melds.length,[]);

	/* SPECIAL CASE: KOKUSHI MUSOU */
	if(this.tiles.length==14){
		var musou_tile=-1;
	
		for(i=0;i<14;i++){
			if(musou_tile==-1){
				if(type(this.tiles[i])!=KOKUSHI_MUSOU_SEQ[i]) break;
			
				if(type(this.tiles[i+1])==KOKUSHI_MUSOU_SEQ[i])
					musou_tile=this.tiles[i],i++;
			} else{
				if(type(this.tiles[i])!=KOKUSHI_MUSOU_SEQ[i-1]) break;
			}
		}

		if(i==14)
			return [[[KOKUSHI_MUSOU,musou_tile]]]
	}

	var mm=this.melds;
	return list.map(function(x){
		return x[2].concat(mm.length?mm:[])
	});
}

Hand.prototype.addMeld = function(type, cards){
	cards.sort(ns);
	for(var i = 0; i < cards.length; i++)
		this.tiles.remove(cards[i]);
	this.melds.push([type, cards[0], cards]);
}

/*
 * Mask bits:
 * 0-14 marks whether this tile is used for chii and
 *      should be ignored.
 */

Hand.prototype.valid_helper=function(start,mask,pairs,melds,desc){
	var result=[];

	if(start==this.tiles.length){
		if(melds==0 && pairs==7) return [[pairs,melds,desc]];
		if(melds>0 && pairs==1) return [[pairs,melds,desc]];

		return [];
	}
	if(start>this.tiles.length) return [];
	var i=start;

	if(mask&(1<<i)) return this.valid_helper(i+1,mask,pairs,melds,desc);

	var j;
	var tile=this.tiles[i];
	
	/* Checking for pairs/pons. If two previous tiles are pair,
	 * this one can't form neither pair nor pon with others. */
	if(i<2 || type(tile)!=type(this.tiles[i-2]))

	/* Next tile is same as this; adding one pair and branching */
	if(type(tile)==type(this.tiles[i+1])){
		/* Pair can only be useful if there are not pairs yet (to form 4
		 * melds and pair), or when there are no melds (7 pairs) */
		if(pairs==0 || melds==0)
		result=result.concat(this.valid_helper(i+2,mask,pairs+1,melds,
			desc.concat([[CLOSED+PAIR,tile]])));

		/* Two next tiles are same as this; adding one pon and branching
		 * unless we have two or more pairs -- in this case, melds are no use. */
		if(type(tile)==type(this.tiles[i+2]) && pairs<2)
			result=result.concat(this.valid_helper(i+3,mask,pairs,melds+1,
				desc.concat([[CLOSED+PON,tile]])));
	}

	/* Checking for chiis: */

	/* Have many pairs, aiming for 7-pairs only; no use checking for chiis */
	if(pairs>1) return result;

	/* No chiis started by 8s and 9s and honors */
	if(numberic(tile)<0 || numberic(tile)>7) return result;

	/* Find first tile suitable for chii. Mask is used here to mark tiles
	 * already used for chiis to prevent combinations like 3345 from forming
	 * two chiis. */
	for(j=i+1;(type(this.tiles[j])==type(tile) || mask&(1<<j)) && j<this.tiles.length;j++)
		;
	if(!tileIsNext(tile,this.tiles[j])) return result;
	var first=j;
		
	/* Second tile */
	for(j=j+1;(type(this.tiles[j])==type(this.tiles[first]) || mask&(1<<j)) && j<this.tiles.length;j++)
		;
	if(!tileIsNext(this.tiles[first],this.tiles[j])) return result;
	var second=j;

	/* Now that we have three tiles forming sequence, branch. It is
	 * possible to search for all chii combinations with picked tile,
	 * but I don't think there are cases where not doing so would miss
	 * a complete hand. */
	result=result.concat(this.valid_helper(i+1,mask|(1<<i)|(1<<first)|(1<<second),pairs,melds+1,
		desc.concat([[CLOSED+CHII,tile]])));

	return result;
}

function calculateFu(combination,hand){
	var description=[["Base score",20]];

	var all_closed=true;
	var pairs_count=0;
	var pon_count=0;
	var kan_count=0;
	
	combination.forEach(function(c){
		var closed=c[0]&CLOSED;
		var kind=c[0]&MELD_MASK;
		var tile=generalize(c[1]);

		if(!closed) all_closed=false;

		if(kind==PAIR){
			if(tile==hand.ownWind && tile==hand.roundWind)
				description.push(["Double wind pair",4]);
			else if(tile==hand.ownWind)
				description.push(["Position wind pair",2]);
			else if(tile==hand.roundWind)
				description.push(["Round wind pair",2]);
			else if(tile==(31<<8) || tile==(32<<8) || tile==(33<<8))
				description.push([capitalize(describeMeld(c)),2]);
			
			pairs_count++;
		} else if(kind==CHII){
		} else if(kind==PON){
			pon_count++;
			
			if(isTerminal(tile))
				description.push(closed?
					[capitalize(describeMeld(c)),8]:
					[capitalize(describeMeld(c)),4]);
			else
				description.push(closed?
					[capitalize(describeMeld(c)),4]:
					[capitalize(describeMeld(c)),2]);
			
		} else if(kind==KAN){
			kan_count++;
			
			if(isTerminal(tile))
				description.push(closed?
					[capitalize(describeMeld(c)),32]:
					[capitalize(describeMeld(c)),16]);
			else
				description.push(closed?
					[capitalize(describeMeld(c)),16]:
					[capitalize(describeMeld(c)),8]);
		}
	});

	if(pairs_count==7) return [25,[["Seven pairs",25]]];
	
/*	if(pon_count==0 && kan_count==0) return hand.ron?
		[30,[["All Sequence",30]]]:
		[20,[["All Sequence",20]]]*/

	if(all_closed && hand.ron) description.push(["Closure Bonus",10]);
	if(!hand.ron && description.length>1) description.push(["Self-draw Bonus",2]);

	if(hand.lastDraw){
		var wait=hand.waitKind(hand.lastDraw,combination);
		
		if(wait==WAIT_CENTRAL || wait==WAIT_EDGE || wait==WAIT_HANGING)
			description.push([capitalize(waits[wait])+" wait",2]);
	}

	var sum=description.fold(0,plus);
	var rounded=Math.ceil(sum/10)*10;

	if(sum!=rounded)
		description.push(["Rounded up",rounded-sum]);

	return [rounded,description];
}

function calculateYaku(combination,hand){
	var i;
	var description=[];

	var all_closed=true;
	var pair_is_special=false;

	var wait=WAIT_NONE;
	if(hand.lastDraw)
		var wait=hand.waitKind(hand.lastDraw,combination);
		
	var allTiles=hand.melds.fold(hand.tiles.slice(),function(a,b){return a.concat(b[2])}).sort(ns);
	
	var pairs=0;
	var chiis=0;
	var pons=0;
	var closedPons=0;
	var openPons=0;
	var kans=0;
	var closedKans=0;
	var openKans=0;
	var colorMelds=0;
	var windMelds=0;

	var colorPairs=0;
	var windPairs=0;
	var pairTile;
	
	var chiiCounts=tiles.map(function(){return 0});
	var ponCounts=tiles.map(function(){return 0});
	var suitsCounts=[0,0,0,0];
	
	var dirtyTerminalMelds=0;
	var pureTerminalMelds=0;
	var dirtyEndMelds=0;
	var pureEndMelds=0;
	
	var specials=0;
	
	combination.forEach(function(c){
		var closed=c[0]&CLOSED;
		var kind=c[0]&MELD_MASK;
		var tile=generalize(c[1]);
		
		if(!closed) all_closed=false;
		suitsCounts[suit(tile)]++;
		
		if(kind==PAIR){
			if(isColor(tile) || tile==hand.ownWind || tile==hand.roundWind)
				pair_is_special=true;
			pairTile=tile;
			
			pairs++;
			if(isColor(tile)) colorPairs++;
			if(isWind(tile)) windPairs++;
			
			if(isTerminal(tile)) dirtyTerminalMelds++,dirtyEndMelds++;
			if(isEnd(tile)) pureTerminalMelds++,pureEndMelds++;
		} else if(kind==CHII){
			chiiCounts[type(tile)]++;
			
			if(numberic(tile)==1 || numberic(tile)==7) pureEndMelds++,dirtyEndMelds++;
		} else if(kind==PON){
			pons++;
			closed?closedPons++:openPons++;
			
			ponCounts[type(tile)]++;
			
			if(isColor(tile)) colorMelds++;
			if(isWind(tile)) windMelds++;
			
			if(tile==hand.ownWind) specials++;
			if(tile==hand.roundWind) specials++;
			
			if(isTerminal(tile)) dirtyTerminalMelds++,dirtyEndMelds++;
			if(isEnd(tile)) pureTerminalMelds++,pureEndMelds++;
		} else if(kind==KAN){
			kans++;
			closed?closedKans++:openKans++;
			
			if(isColor(tile)) colorMelds++;
			if(isWind(tile)) windMelds++;
			
			if(tile==hand.ownWind) specials++;
			if(tile==hand.roundWind) specials++;

			if(isTerminal(tile)) dirtyTerminalMelds++,dirtyEndMelds++;
			if(isEnd(tile)) pureTerminalMelds++,pureEndMelds++;
		}
	});
	
	function returnYakuman(text,value){
		return [value,[[text,value]]];
	}
	
	var greens=allTiles.fold(0,function(a,b){return isGreen(b)?a+1:a;});
	if(greens==allTiles.length)
		description.push(["ALL GREEN",-1]);

	var allSameSuit=allTiles.fold(suit(allTiles[0]),function(a,b){return suit(b)==a?a:-1;});
	if(allSameSuit!=-1 && allSameSuit!=HONORS){
		var extra_tile=-1;
		for(i=0;i<CHUUREN_POOTOO.length;i++){
			if(extra_tile==-1){
				if(numberic(allTiles[i])!=CHUUREN_POOTOO[i]) break;
				
				if(i>=2 && numberic(allTiles[i+1])==CHUUREN_POOTOO[i])
					extra_tile=allTiles[i];
			} else{
				if(numberic(allTiles[i+1])!=CHUUREN_POOTOO[i]) break;
			}
		}
		
		if(i==CHUUREN_POOTOO.length)
			description.push(hand.lastDraw==extra_tile?
				["NINE GATES NINE WAIT",-2]:
				["NINE GATES",-1]);
	}

	if(colorMelds==3)
		description.push(["BIG THREE ELEMENTS",-1]);
	
	if(windMelds==3 && windPairs==1)
		description.push(["LITTLE FOUR WINDS",-1]);
	
	if(windMelds==4)
		description.push(["BIG FOUR WINDS",-2]);

	if(closedPons+closedKans==4)
		description.push(hand.lastDraw==pairTile?
			["FOUR CONCEALED TRIPLES PAIR WAIT",-2]:
			["FOUR CONCEALED TRIPLES",-1]);

	if(kans==4)
		description.push(["FOUR QUADS",-1]);
	
	if(colorMelds+windMelds+colorPairs+windPairs==combination.length)
		description.push(["ALL HONORS",-1]);
	
	if(pureTerminalMelds==combination.length)
		description.push(["ALL TERMINALS",-1]);

	if((combination[0][0]&MELD_MASK)==KOKUSHI_MUSOU)
		description.push(hand.lastDraw==combination[0][1]?
			["THIRTEEN ORPHANS THIRTEEN WAIT",-2]:
			["THIRTEEN ORPHANS",-1]);

		
	var sum=description.fold(0,plus);
	if(sum!=0) return [sum,description];

	if(all_closed && !hand.ron)
		description.push(["SELF PICK",1]);

	if(colorPairs==1 && colorMelds==2)
		description.push(["LITTLE THREE ELEMENTS",4]),colorMelds-=2;
	
	if(colorMelds+specials>0)
		description.push(["SPECIAL TILES",colorMelds+specials]);

	if(all_closed && !pair_is_special && wait==WAIT_TWO_SIDED && pons==0 && kans==0)
		description.push(["NO-POINTS HAND",1]);

	var terminals=allTiles.fold(0,function(a,b){return isTerminal(b)?a+1:a;});
	if(terminals==0)
		description.push(["ALL SIMPLES",1]);

	var doubleChiis=chiiCounts.fold(0,function(a,b){if(b==2) a+=1; return a;});
	if(doubleChiis==1 && all_closed)
		description.push(["ONE SET OF IDENTICAL SEQUENCES",1]);
	
	if(hand.dabururiichi)
		description.push(["DOUBLE-READY",2]);
	else if(hand.riichi)
		description.push(["READY HAND",1]);

	if((hand.dabururiichi || hand.riichi) && hand.ippatsu)
		description.push(["ONE-SHOT",1]);

	if(hand.rinjan)
		description.push(["GOING OUT ON A SUPPLEMENTAL TILE FROM THE DEAD WALL",1]);
	
	if(hand.chankan)
		description.push(["ROBBING A QUAD TO GO OUT",1]);
	
	if(hand.haidei)
		description.push(["LAST TILE FROM THE WALL",1]);
	
	if(hand.houdei)
		description.push(["LAST TILE FROM THE WALL DISCARD ",1]);
		
	
	if(		(chiiCounts[ 0] && chiiCounts[ 3] && chiiCounts[ 6]) ||
			(chiiCounts[ 9] && chiiCounts[12] && chiiCounts[15]) ||
			(chiiCounts[18] && chiiCounts[21] && chiiCounts[24]) ){
		description.push(["STRAIGHT THROUGH",all_closed?2:1]);
	}
	

	if(dirtyTerminalMelds==combination.length)
		description.push(["ALL TERMINALS AND HONORS",pairs==7?2:5]);
	else if(pureEndMelds==combination.length)
		description.push(["TERMINAL IN EACH SET",all_closed?3:2]);
	else if(dirtyEndMelds==combination.length)
		description.push(["TERMINAL OR HONOR IN EACH SET",all_closed?2:1]);
	 
	
	[0,1,2,3,4,5,6].forEach(function(a){
		if(chiiCounts[a] && chiiCounts[a+9] && chiiCounts[a+18])
			description.push(["THREE COLOUR STRAIGHT",all_closed?2:1]);
	});
	
	[0,1,2,3,4,5,6,7,8].forEach(function(a){
		if(ponCounts[a] && ponCounts[a+9] && ponCounts[a+18])
			description.push(["THREE COLOUR TRIPLETS",2]);
	});
	
	if(pairs==7)
		description.push(["SEVEN PAIRS",2]);
	
	if(chiis==0 && pons+kans==4 && dirtyTerminalMelds!=combination.length)
		description.push(["ALL TRIPLET HAND",2]);
	
	if(closedPons+closedKans==3)
		description.push(["THREE CONCEALED TRIPLETS",2]);
	
	if(kans==3)
		description.push(["THREE QUADS",2]);
	
	if(		(suitsCounts[MAN]==0 && suitsCounts[PIN]==0 && suitsCounts[HONORS]==0)	||
			(suitsCounts[MAN]==0 && suitsCounts[SOU]==0 && suitsCounts[HONORS]==0)	||
			(suitsCounts[SOU]==0 && suitsCounts[PIN]==0 && suitsCounts[HONORS]==0)	){
		description.push(["SINGLE SUIT HAND",all_closed?6:5]);
	}else if(	(suitsCounts[MAN]==0 && suitsCounts[PIN]==0 && suitsCounts[SOU]!=0) ||
				(suitsCounts[MAN]==0 && suitsCounts[PIN]!=0 && suitsCounts[SOU]==0) ||
				(suitsCounts[MAN]!=0 && suitsCounts[PIN]==0 && suitsCounts[SOU]==0) ){
		description.push(["ONE SUIT PLUS HONORS",all_closed?3:2]);
	}

	if(doubleChiis==2 && all_closed)
		description.push(["TWO SETS OF IDENTICAL SEQUENCES",3]);
	

	var tripleChiis=chiiCounts.fold(0,function(a,b){if(b==3) a+=1; return a;});
	if(tripleChiis==1)
		description.push(["ONE SUIT TRIPLE SEQUENCE",2]);

	[0,1,2,3,4,5,6,9,10,11,12,13,14,15,18,19,20,21,22,23,24].forEach(function(a){
		if(ponCounts[a] && ponCounts[a+1] && ponCounts[a+2])
			description.push(["ONE SUIT TRIPLE SEQUENCE",2]);
	});

	if(description.length>0){
		var redTiles=allTiles.fold(0,function(a,b){if(b&RED) a+=1; return a;});
		if(redTiles>0)
			description.push(["RED TILES",redTiles]);
		
		
		var doras=hand.dora.map(function(a){return type(getDora(a))});
		var doraTiles=allTiles.fold(0,function(a,tile){
			return a+doras.fold(0,function(b,dora){if(type(tile)==dora) b++; return b;});
		});
		if(doraTiles>0)
			description.push(["DORA",doraTiles]);
	}
	
	var sum=description.fold(0,plus);

	return [sum,description];
}

