

function e(n){return document.getElementById(n);}
function defined(x){return x!=undefined;}
function now(){return new Date().getTime()}
function capitalize(s){return s.substr(0,1).toUpperCase()+s.substr(1).toLowerCase()}
function lc(s){return s.toLowerCase()}
function uc(s){return s.toUpperCase()}
function plus(a,b){return a+b[1]}

var sounds={};
function playSound(s){
	var sound=sounds[s];

	try{
		if(!defined(sound))
			sound=sounds[s]=soundManager.createSound({id: s, url: s});

		if(defined(sound))
			sound.play();

	} catch(e){}
}

function translate(word,func){
	var translation=translations[uc(word)]
	if(!defined(translation)) return capitalize(word);

	var html="<span class='tl'>"+(func?func:capitalize)(word);

	var have_voice=!!translation[0];
	var have_text=translation[1]||translation[2];

	if(have_voice || have_text) html+="<span style='position: relative'>";

	if(have_voice) html+="<a href='#' onclick='playSound(\""+translation[0]+"\"); return false;'><img src='loudspeaker.png' alt='[LISTEN]' /></a>";
	else if(have_text) html+="<img src='arrowdown.png' alt='[DROPDOWN]' />";

	if(have_text){
		html+="<span class='dropdown'>"+translation[1]+"<br />"+translation[2]+"</span>";
	}

	if(have_voice || have_text) html+="</span>";

	html+="</span>";

	return html;
}

Table.prototype.onTimer=function(){
	var now=new Date().getTime();
	var eslaped=now-this.now;
	this.now=now;

	for(var i=0;i<this.movingTiles.length;i++){
		var tile=this.movingTiles[i];

		var dx=tile.targetX-tile.x;
		var dy=tile.targetY-tile.y;
		var angle=Math.atan(dx/dy);
		if(dy<0) angle+=Math.PI;

		var fulldist=Math.sqrt(dx*dx+dy*dy);
		var bonus=Math.min(1,(Math.max(0,fulldist/TILE_SPEED_BONUS_RANGE)));
		var speed=TILE_BASE_SPEED+TILE_SPEED_BONUS*bonus;
		var dist=speed*eslaped/1000;
		
		if(fulldist>dist){
			tile.relocate(tile.x+Math.sin(angle)*dist,tile.y+Math.cos(angle)*dist);
		} else{
			tile.place(tile.targetX,tile.targetY);

			if(tile.fading)
				tile.remove();
		}

		tile.elem.style.left=tile.x;
		tile.elem.style.top=tile.y;
		
		if(tile.fading || tile.appearing){
			var idx=tile.idleX-tile.targetX;
			var idy=tile.idleY-tile.targetY;
			var idledist=Math.sqrt(idx*idx+idy*idy);

			tile.elem.style.opacity=(tile.opacity?tile.opacity:1)*tile.fading?
				fulldist/idledist:
				1-fulldist/idledist;
		}
	}

	if(this.movingTiles.length==0){
		clearInterval(this.timer);
		this.timer=undefined;
	}
}
function Table(w,h,tileset,ee){
	this.tiles=new Array;
	this.movingTiles=new Array;
	this.tileset=tileset;

	this.dora=new Array;

	this.timer=undefined;

	this.roundWind=WIND_EAST;

	var elem=document.createElement('div');
	elem.style.position		= "relative";
	elem.style.width		= w;
	elem.style.height		= h;

	if(!ee) ee=document.body;
	ee.appendChild(elem);

	this.elem=elem;
}

function Tile(code,x,y,events){
	this.x=x;
	this.y=y;
	this.targetX=x;
	this.targetY=y;
	this.idleX=x;
	this.idleY=y;
	this.code=code;
	this.fading=false;
	this.appearing=false;

	var tile=this;
	
	if(events){
		if(events.onclick) this.onclick=function(){events.onclick(tile)};
		if(events.onmouseover) this.onmouseover=function(){events.onmouseover(tile)};
		if(events.onmouseout) this.onmouseout=function(){events.onmouseout(tile)};
	}

	this.elem=undefined;
}

function Set(){
	this.tiles=new Array;
	this.melds=new Array;

	this.lastDraw=undefined;
}

function SetHand(){
	this.wait=new Array;
	this.valid=new Array;

	this.ownWind=WIND_EAST;
}

function TileSet(picture,w,h){
	this.picture=picture;
	this.w=w;
	this.h=h;
}

SetHand.prototype=new Set();

Table.prototype.startTimer=function(){

	if(defined(this.timer)) return;

	this.now=new Date().getTime();
	this.timer=setInterval(function(a){a.onTimer()},20,this);
}

Table.prototype.addTile=function(code,x,y,events){
	var tile=new Tile(code,x,y,events);
	var elem=tile.changeTileset(this.tileset);

	this.elem.appendChild(elem);

	tile.table=this;

	this.tiles.push(tile);
	
	return tile;
}

Table.prototype.addTileAppear=function(code,x,y,events){
	var tile=this.addTile(code,x,y+TILE_HEIGHT,events);
	
	tile.appearing=true;
	tile.moveTo(x,y);
	
	return tile;
}

Table.prototype.addSet=function(x,y){
	var set=new Set;

	set.x=x;
	set.y=y;

	set.table=this;
	
	return set;
}

Table.prototype.addHand=function(x,y,waitEvents){
	var set=new SetHand;

	set.x=x;
	set.y=y;
	set.waitEvents=waitEvents;

	set.table=this;
	
	return set;
}

Set.prototype.addTile=function(code,x,y,events){
	var i;
	var left=this.x;

	for(i=0;i<this.tiles.length;i++){
		if(this.tiles[i].code>code) break;
		left+=this.tiles[i].tileset.w;
	}

	if(!defined(x)){
		x=left;
		y=this.y;
	}

	var tile=this.table.addTile(code,x,y,events);
	this.lastDraw=tile;
	this.tiles=this.tiles.slice(0,i).concat(tile,this.tiles.slice(i));

	this.changeWait();
	this.refresh();

	return tile;
}

Set.prototype.refresh=function(){
	var i;
	var left=this.x;

	for(i=0;i<this.tiles.length;i++){
		var tile=this.tiles[i];

		tile.moveTo(left,this.y);
		left+=tile.tileset.w;
	}

	/* Display wait */
	if(this.wait && this.wait.length){
		left+=this.table.tileset.w/2;
		for(var index=0;index<this.wait.length;index++){
			var tile=this.wait[index];
			left+=tile.tileset.w;
		}
	}

	/* Display open melds */
	left+=this.table.tileset.w;
	for(var i=0;i<this.melds.length;i++){
		var entry=this.melds[i][1];
		for(var j=0;j<entry.length;j++){
			var tile=entry[j];
			tile.moveTo(left,this.y);

			left+=tile.tileset.w;
		}

		left+=this.table.tileset.w/2;
	}
}

Set.prototype.removeTile=function(tile){
	this.removeTileHelper(tile,true);
}

Set.prototype.fadeOutTile=function(tile){
	this.removeTileHelper(tile,false);
}

Set.prototype.removeTileHelper=function(tile,instantly){
	var i,index;
	
	for(index=0;index<this.tiles.length;index++)
		if(this.tiles[index]==tile) break;

	if(index==this.tiles.length) return;
	instantly?
		tile.remove():
		tile.fadeOut();

	this.lastDraw=undefined;
	this.tiles=this.tiles.slice(0,index).concat(this.tiles.slice(index+1));
}

Set.prototype.hasType=function(t){
	var i;

	for(i=0;i<this.tiles.length;i++)
		if(type(this.tiles[i].code)==t) return this.tiles[i];

	return;
}

Set.prototype.prevTile=function(tile){
	var i;

	for(i=1;i<this.tiles.length;i++)
		if(this.tiles[i]==tile) return this.tiles[i-1];

	return;
}
Set.prototype.nextTile=function(tile){
	var i;

	for(i=0;i<this.tiles.length-1;i++)
		if(this.tiles[i]==tile) return this.tiles[i+1];

	return;
}

Set.prototype.changeWait=function(){
}

SetHand.prototype.toHand=function(){
	var hand=new Hand;
	if(defined(debug)){
		console.log("toHand: ");
		console.log(hand);
	}
	for(var i=0;i<this.tiles.length;i++)
		hand.add(this.tiles[i].code);
	
	for(var i=0;i<this.melds.length;i++)
		hand.melds.push([this.melds[i][0],this.melds[i][1][0].code,this.melds[i][1].map(function(a){return a.code;})]);
	
	if(this.lastDraw)
		hand.lastDraw=this.lastDraw.code;

	hand.dora=this.table.dora;
	hand.roundWind=this.table.roundWind;
	hand.ownWind=this.ownWind;

	return hand;
}

SetHand.prototype.changeWait=function(){
	var hand=new Hand;
	var left=this.x;

	for(var index=0;index<this.wait.length;index++)
		this.wait[index].fadeOut();
	
	this.wait=[];
	
	for(var index=0;index<this.tiles.length;index++){
		left+=this.tiles[index].tileset.w;
		hand.add(this.tiles[index].code);
	}

	for(var i=0;i<this.melds.length;i++){
		var entry=this.melds[i];
		
		hand.melds.push([entry[0],entry[1][0]]);
	}

	var wait=hand.wait();

	left+=this.table.tileset.w/2;
	for(var index=0;index<wait.length;index++){
		var entry=wait[index];
		var tile=this.table.addTileAppear(entry[0],left,this.y,this.waitEvents);
		tile.setOpacity(0.6);
		left+=tile.tileset.w;
		this.wait.push(tile);
	}
}

SetHand.prototype.addMeld=function(kind,meld,events){
	var newMeld=[];

	newMeld.push(kind);
	newMeld.push([]);
	
	for(var j=0;j<meld.length;j++){
		var tile=meld[j];

		newMeld[1].push(this.table.addTile(tile.code,tile.x,tile.y,events));
		this.fadeOutTile(tile);
	}

	this.melds.push(newMeld);

	this.changeWait();
	this.refresh();
}
SetHand.prototype.removeMeld=function(meldTile){

	for(var i=0;i<this.melds.length;i++){
		var entry=this.melds[i][1];
		for(var j=0;j<entry.length;j++){
			if(entry[j]==meldTile){
				for(var z=0;z<entry.length;z++)
					entry[z].fadeOut()
				this.melds.remove(this.melds[i]);
			
				this.changeWait();
				this.refresh();
				return;
			}
		}
	}
}
Tile.prototype.moveTo=function(x,y){
	this.table.movingTiles.remove(this);
	this.table.movingTiles.push(this);
	
	this.targetX=x;
	this.targetY=y;

	this.table.startTimer();
}

Tile.prototype.relocate=function(x,y){
	this.appearing=false;
	this.elem.style.left=this.x=x;
	this.elem.style.top=this.y=y;
}

Tile.prototype.place=function(x,y){
	this.table.movingTiles.remove(this);

	this.relocate(this.targetX=this.idleX=this.x=x,this.targetY=this.idleY=this.y=y);
}

Tile.prototype.fadeOut=function(){
	this.table.movingTiles.remove(this);
	this.table.movingTiles.push(this);
	
	this.idleX=this.x;
	this.idleY=this.y;
	this.targetX=this.x;
	this.targetY=this.y-TILE_HEIGHT;
	this.fading=true;

	this.table.startTimer();
}

Tile.prototype.setOpacity=function(v){
	this.opacity=v;

	this.elem.style.opacity=v;
}

Tile.prototype.remove=function(){
	
	if(this.table)
		this.table.tiles.remove(this);

	if(this.elem){
		if(this.elem.parentNode)
			this.elem.parentNode.removeChild(this.elem);
	
		if(this.onclick)
			this.elem.removeEventListener("click",this.onclick,false);
		if(this.onmouseover)
			this.elem.removeEventListener("mouseover",this.onmouseover,false);
		if(this.onmouseout)
			this.elem.removeEventListener("mouseout",this.mouseout,false);
	}

}

Tile.prototype.changeTileset=function(tileset){
	var old=this.elem;

	var elem=tileset.createTileGraphic(this.code);
	elem.style.position	= defined(this.elem)?this.elem.style.position:"absolute";
	elem.style.left		= this.x;
	elem.style.top		= this.y;

	if(this.onclick) elem.addEventListener("click",this.onclick,false);
	if(this.onmouseover) this.elem.addEventListener("mouseover",this.onmouseover,false);
	if(this.onmouseout) this.elem.addEventListener("mouseout",this.mouseout,false);

	if(old)
		old.parentNode.replaceChild(elem,old);

	this.elem=elem;
	this.tileset=tileset;

	return elem;
}

TileSet.prototype.createTileGraphic=function(code){
	if(code>=TILE_WHITESPACE){
		var elem=document.createElement('div');
		elem.style.height				= this.h;
		elem.style.display				= "inline-block";
		
		if(code==TILE_WHITESPACE)
			elem.style.width			= this.w;
		else if(code==TILE_HALFSPACE)
			elem.style.width			= this.w/2;

		return elem;
	}

	var y=suit(code);
	var x=(y==HONORS)?
		1+type(code)-27:
		(code&RED?0:numberic(code));

	if(code&CLOSED){x=8;y=3;}
	
	var elem=document.createElement('div');
	elem.style.backgroundPosition	= ""+(-x*this.w)+"px "+(-y*this.h)+"px";
	elem.style.backgroundImage		= "url("+this.picture+")";
	elem.style.width				= this.w;
	elem.style.height				= this.h;
	elem.style.display				= "inline-block";

	return elem;
}

function createTile(tileset,code,events){
	var tile=new Tile(code,0,0,events);
	var elem=tile.changeTileset(tileset);
	elem.style.position				= "";

	return tile;
}

function createCombination(tileset,combination,events){
	var elem=document.createElement('div');
	elem.style.padding				= 0;
	elem.style.margin				= 0;

	function add(c){elem.appendChild(createTile(tileset,c,events).elem);}
	
	combination.forEach(function(c){
		var t=(c[0]&MELD_MASK);
		var tt=generalize(c[1]);

		if(t==PAIR){
			add(tt);
			add(tt);
		} else if(t==PON){
			add(tt);
			add(tt);
			add(tt);
		} else if(t==CHII){
			add(tt);
			add(tt+0x100);
			add(tt+0x200);
		} else if(t==KAN){
			var ttt=c[0]&CLOSED?tt|CLOSED:tt;
			add(tt);
			add(ttt);
			add(ttt);
			add(tt);
		} else if(t==KOKUSHI_MUSOU){
			KOKUSHI_MUSOU_SEQ.forEach(function(v){
				if(v==type(tt)) add(v<<8);
				add(v<<8);
			});		
		}
		add(TILE_HALFSPACE);
	});

	elem.removeChild(elem.lastChild);

	return elem;
}

/* copy from *.html */

var mode='';
var modeElement;

function disable(tile){
	if(tile.tileset==smallTileset) tile.changeTileset(shadowSmallTileset);
	else if(tile.tileset==defaultTileset) tile.changeTileset(shadowTileset);
	else return;

	hand.refresh();
}

function disabled(tile){
	return tile.tileset==shadowTileset || tile.tileset==shadowSmallTileset;
}

function disableAll(){
	var i;

	for(i=0;i<hand.tiles.length;i++){
		var tile=hand.tiles[i];

		tile.changeTileset(shadowTileset);
	}

	hand.refresh();
}

function enable(tile){
	console.log(tile);
	if(tile.tileset==shadowSmallTileset) tile.changeTileset(smallTileset);
	else if(tile.tileset==shadowTileset) tile.changeTileset(defaultTileset);
	else return;

	hand.refresh();
}
function enabled(tile){
	return tile.tileset==defaultTileset || tile.tileset==smalltTileset;
}

function enableAll(){
	var i;

	for(i=0;i<hand.tiles.length;i++){
		var tile=hand.tiles[i];

		tile.changeTileset(defaultTileset);
	}

	hand.refresh();
}

function findChii(tile){
	if(!isSuit(tile.code)) return;
	var t2,t3;

	var p2=type(makeSuit(suit(tile.code),numberic(tile.code)+2));
	var p1=type(makeSuit(suit(tile.code),numberic(tile.code)+1));
	var m1=type(makeSuit(suit(tile.code),numberic(tile.code)-1));
	var m2=type(makeSuit(suit(tile.code),numberic(tile.code)-2));

	if((t2=hand.hasType(m2)) && (t3=hand.hasType(m1)))
		return [t2,t3,tile];
	if((t2=hand.hasType(m1)) && (t3=hand.hasType(p1)))
		return [t2,tile,t3];
	if((t2=hand.hasType(p1)) && (t3=hand.hasType(p2)))
		return [tile,t2,t3];
}

function findPon(tile){
	var t=type(tile.code);

	var p=hand.prevTile(tile);
	var pp=hand.prevTile(p);
	var n=hand.nextTile(tile);
	var nn=hand.nextTile(n);

	if(pp && type(pp.code)==t) return [pp,p,tile];
	if(nn && type(nn.code)==t) return [tile,n,nn];
	if(p && n && type(p.code)==t && type(n.code)==t) return [p,tile,n];
	
	return;
}

function findKan(tile){
	var t=type(tile.code);

	var p=hand.prevTile(tile);
	var pp=hand.prevTile(p);
	var ppp=hand.prevTile(pp);
	var n=hand.nextTile(tile);
	var nn=hand.nextTile(n);
	var nnn=hand.nextTile(nn);

	if(ppp && type(ppp.code)==t)						return [ppp,pp,p,tile];
	if(pp && n && type(pp.code)==t && type(n.code)==t)	return [pp,p,tile,n];
	if(p && nn && type(p.code)==t && type(nn.code)==t)	return [p,tile,n,nn];
	if(nnn && type(nnn.code)==t)						return [tile,n,nn,nnn];
	
	return;
}

function setMode(m){
	if(modeElement)
		modeElement.className='';

	if(mode==m) m='';
	mode=m;

	if(mode=='chii' || mode=='pon' || mode=='kan' || mode=='ckan'){
		disableAll();
		
		for(i=0;i<hand.tiles.length;i++){
			var tile=hand.tiles[i];
			var meld;
			
		    	 if(mode=='chii')	meld=findChii(tile);
			else if(mode=='pon')	meld=findPon(tile);
			else if(mode=='kan')	meld=findKan(tile);
			else if(mode=='ckan')	meld=findKan(tile);
			if(defined(debug)){
				console.log("meld: ");
				console.log(meld);
			}
			if(!defined(meld)) continue;

			enable(tile);
		}
	} else if(mode=='dora'){
		
	} else{
		enableAll();
		mode="";
	}

	if(modeElement=e(mode)) modeElement.className="activemode";

	return false;
}
