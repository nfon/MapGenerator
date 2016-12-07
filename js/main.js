var map;
var genericItems;
var debugMode = false;

function clearMessage() {
	$("#messages").html("");
}

function displayMessage(msg) {
	if (debugMode)
		$("#messages").append(msg+"</br>");
	else
		console.log(msg);
}

function getRandom(min, max) {
  	return Math.floor(Math.random() * (max - min +1)) + min;
}

function getRandomNormal(min, max) {
	return Math.min(max,Math.max(min,Math.floor(chance.normal({mean: ((min+max)/2), dev: ((min+max)/4)}))));
}

function round(number,dec) {
	return Math.round(number*Math.pow(10,dec))/Math.pow(10,dec);
}

var Map = function (mapL, mapH, heightMin, heightMax, summitNb, lakeNb, riverNb, fogMode, fogOpponentsMode){
	this.$map = $("#map");
	this.$canvas = this.$map.find("canvas");
	this.map  = new Array();
	this.mapL = mapL;
	this.mapH = mapH;
	this.heightMin = heightMin;
	this.heightMax = heightMax;

	this.summitNb = summitNb;
	this.lakeNb = lakeNb;
	this.riverNb = riverNb;

	this.fogMode = fogMode;
	this.fogOpponentsMode = fogOpponentsMode;
	this.coefLightSize = 2;

	this.initialized = true;

	this.ticker;

    var self = this;

    this.create = function(){
		clearMessage();
		displayMessage("Map generation");
		self.generate();
		displayMessage("Creation of the summits");
		self.generateSummits();
		displayMessage("Creation of the moutains");
		self.generateMountains();
		displayMessage("Creation of the sources");
		self.generateLakesSource();
		displayMessage("Creation of the lakes");
		self.generateLakes();
		displayMessage("Creation of the rivers");
		self.generateRivers();
	}

	this.generate = function() {
		for (var i=0;i<self.mapH;i++) {
			self.map[i] = new Array();
			for (var j=0;j<self.mapL;j++) {
				var altitude = getRandomNormal(self.heightMin,Math.floor((self.heightMin+self.heightMax)/2));
				self.map[i][j]={type:1, 
								altitude:altitude,
								food:15-altitude,
								opacity:self.fogMode?0.1:1
							   };
			}
		}
	}

	this.generateSummits = function() {
		for (var i=0;i<self.summitNb;i++) {
			var x = getRandom(0,self.mapH-1);
			var y = getRandom(0,self.mapL-1);
			self.map[x][y].altitude=self.heightMax;
			self.changeSurroundings(x,y,self.heightMax);
		}
	}

	this.generateMountains = function() {
		for (var i=self.heightMax; i>self.heightMin+1; i--) {
			self.generateRelief(i);
		}
	}

	this.generateRelief = function(val) {
		displayMessage("Generate level "+val);
		for (var i=0;i<self.mapH;i++) {
			for (var j=0;j<self.mapL;j++) {
				if (self.map[i][j].altitude==val) {
					self.changeSurroundings(i,j,val-1);
				}
			}
		}
	}

	this.changeSurroundings = function(y,x,val) {
		var mountainSizeXMin=getRandomNormal(0,5);
		var mountainSizeXMax=getRandomNormal(0,5);
		var mountainSizeYMin=getRandomNormal(0,5);
		var mountainSizeYMax=getRandomNormal(0,5);

		for (var j=(x-mountainSizeXMin);j<=(x+mountainSizeXMax);j++) {
			for (var i=(y-mountainSizeYMin);i<=(y+mountainSizeYMax);i++) {
				if (i>=0 && i<self.mapH) {
					if (j>=0 && j<self.mapL) {
						if (x!=j || y!=i) {
							if (self.map[i][j].altitude<val) {
								self.map[i][j].altitude=getRandomNormal(val+1,val-1);
							}
						}
					}
				}
			}
		}
	}

	this.generateLakesSource = function() {
		for (var i=0;i<self.lakeNb;i++) {
			var x = getRandom(0,self.mapH-1);
			var y = getRandom(0,self.mapL-1);
			if (self.map[x][y].altitude>=self.heightMax-1 && self.heightMax!=self.heightMin+1)
				i--;
			else
				self.map[x][y].type=0;
		}
	}

	this.generateLakes = function() {
		for (var i=self.heightMax; i>self.heightMin; i--) {
			self.generateLake(i);
		}
	}

	this.generateLake = function(val) {
		displayMessage("Generate River level "+val);
		for (var i=0;i<self.mapH;i++) {
			for (var j=0;j<self.mapL;j++) {
				if (self.map[i][j].type==0 && self.map[i][j].altitude==val) {
					self.changeSurroundingsLake(i,j,val);
				}
			}
		}
	}

	this.changeSurroundingsLake = function(y,x,val) {
		var riverSizeXMin=getRandomNormal(0,4);
		var riverSizeXMax=getRandomNormal(0,3);
		var riverSizeYMin=getRandomNormal(0,4);
		var riverSizeYMax=getRandomNormal(0,3);
		for (var j=(x-riverSizeXMin);j<=(x+riverSizeXMax);j++) {
			for (var i=(y-riverSizeYMin);i<=(y+riverSizeYMax);i++) {
				if (i>=0 && i<self.mapH) {
					if (j>=0 && j<self.mapL) {
						if (x!=j || y!=i) {
							if (self.map[i][j].altitude<=val) {
								self.map[i][j].type=0;
							}
						}
					}
				}
			}
		}
	}

	this.generateRivers = function() {
		for (var i=0;i<self.riverNb;i++) {
			var side = getRandom(0,1);
			var orientation;
			if (side) {
				if (getRandom(0,1)) {
					var x = 0;
					orientation=0;
				}
				else {
					var x = self.mapH-1;
					orientation=2;
				}

				var y = getRandom(0,self.mapL-1);
			}
			else {
				if (getRandom(0,1)) {
					var y = 0;
					orientation=3;
				}
				else {
					var y = self.mapL-1;	
					orientation=1;			
				}
				var x = getRandom(0,self.mapH-1);
			}

			self.map[x][y].type=0;
			self.drawRiver(x,y,orientation);
		}
	}

	this.drawRiver = function(x,y,orientation) {

		/*
		0 1 2
		3 x 4
		5 6 7
		*/

		var curHeight = self.map[x][y].altitude;
		var inside=true;
		var i=prevI=x;
		var j=prevJ=y;
		var length = 0;
		var direction = 0;
		var safety=0;
		while (inside) {
			if (length>(self.mapH*self.mapL)/4)
				var direction = getRandom(0,8);
			else
			{
				switch(orientation) {
					case 0 : direction = getRandom(0,4)+3; break;
					case 1 : direction = chance.pickone([0,1,3,5,6]); break;
					case 2 : direction = getRandom(0,4);  break;
					case 3 : direction = chance.pickone([1,2,4,6,7]);  break;
				}
			}
			switch(direction) {
				case 0 : i=i-1; j=j-1; break;
				case 1 : i=i-1; break;
				case 2 : i=i-1; j=j+1; break;
				case 3 : j=j-1; break;
				case 4 : j=j+1; break;
				case 5 : i=i+1; j=j-1; break;
				case 6 : i=i+1; break;
				case 7 : i=i+1; j=j+1; break;
			}


			i = Math.min(self.mapH-1,Math.max(0,i));
			j = Math.min(self.mapH-1,Math.max(0,j));
			

			if ( ( /*self.map[i][j]<0 ||*/ i==0 || i==mapH-1 || j==0 || j==self.mapL-1 ) && length > 5 )
				inside=false;
			
			if( self.map[i][j].type != 0 ) {
				length++;
				if (self.map[i][j].altitude<=curHeight) {
					safety=0;
					curHeight = self.map[i][j].altitude;
					self.map[i][j].type = 0;
					prevI=i;
					prevJ=j;
				}
				else
				{
					if (safety<10) {
						i=prevI;
						j=prevJ;
						if (safety==5)
							curHeight++;
						safety++;
					}
				}
			}
		}
	}

	this.lightSurroundingPlayer = function(o) {
		if (o>=0)
			var player = opponents.opponents[o];
		else
			var player = hero;

		var x = player.coordinates.x;
		var y = player.coordinates.y;

		var lightSize=self.map[x][y].altitude*self.coefLightSize;
		for (var i=(x-(lightSize+2));i<=(x+lightSize+2);i++) {
			for (var j=(y-(lightSize+2));j<=(y+lightSize+2);j++) {
				if (i>=0 && i<self.mapL) {
					if (j>=0 && j<self.mapH) {
						var powX = Math.pow(i-x,2);
						var powY = Math.pow(j-y,2);
						var opacity = player.map[i][j].opacity;
						if ( powX + powY <= Math.pow(lightSize+2,2) && player.map[i][j].opacity<0.3 )
							opacity=0.3;
						if ( powX + powY <= Math.pow(lightSize+1,2) && player.map[i][j].opacity<0.5 )
							opacity=0.5;
						if ( powX + powY < Math.pow(lightSize,2) )
							opacity=1;

						player.map[i][j].opacity=opacity;
					}
				}
			}
		}
	}

	this.countDiscovery = function(){
		var discovery =  0;
		for (var i=0;i<self.mapH;i++) {
			for (var j=0;j<self.mapL;j++) {
				discovery+=hero.map[i][j].opacity;
			}
		}
	    $("#discovery").text( Math.round( (discovery/self.map.length) * 100)/100+"% discovered");
	}

	this.draw = function() {
		var r = [66,98,68,54,49,38,29,87,74,153,255];
		var g = [198,255,214,181,150,115,79,56,52,153,255];
		var b = [255,66,39,29,29,23,19,43,42,153,255];

		var c2 = $("#map>canvas")[0];
		var ctx2 = c2.getContext("2d");

		var c1 = document.createElement("canvas");
		c1.width = self.mapL;
		c1.height = self.mapH;
		var ctx1 = c1.getContext("2d");

		var imgData = ctx1.createImageData(self.mapL, self.mapH);
		for (var i=0; i<imgData.data.length; i+=4) {
		    var y = (i/4)%self.mapL;
		    var x = Math.floor(i/4/self.mapL);
		    var opacity = self.map[x][y].opacity;
		    if (hero.coordinates.x==x && hero.coordinates.y==y) {
				imgData.data[i] = 255; 
	    		imgData.data[i+1] = 0;
	    		imgData.data[i+2] = 0;
	    		imgData.data[i+3] = 255;
	    		opacity=255;
		    }
		    else {
		    	if (self.fogMode && hero.follow) {
		    		opacity = Math.max(opacity,hero.map[x][y].opacity);
		    	}
		    	if (self.fogOpponentsMode) {
		    		for (var o=0; o<opponents.opponentNb; o++) {
		    			if (opponents.opponents[o].follow)
		    				opacity = Math.max(opacity,opponents.opponents[o].map[x][y].opacity);
		    		}
	    		}
		    	if (self.map[x][y].type==1) {
					imgData.data[i] = r[self.map[x][y].altitude]; 
		    		imgData.data[i+1] = g[self.map[x][y].altitude];
		    		imgData.data[i+2] = b[self.map[x][y].altitude];
		    		imgData.data[i+3] = 255*opacity;
		    	}
		    	else {
				    imgData.data[i] = 66; 
		    		imgData.data[i+1] = 198;
		    		imgData.data[i+2] = 255;
	    			imgData.data[i+3] = 255*opacity; 
		    	}
		    }
		    for (var o=0; o<opponents.opponentNb; o++) {
		    	var opponent = opponents.opponents[o];
		    	if (opponent.coordinates.x == x && opponent.coordinates.y == y) {
		    		if (opponent.health) {
						imgData.data[i] = 244; 
		    			imgData.data[i+1] = 66;
		    			imgData.data[i+2] = 194;
		    		}
		    		else {
		    			imgData.data[i] = 0; 
		    			imgData.data[i+1] = 0;
		    			imgData.data[i+2] = 0;
		    		}
	    			imgData.data[i+3] = 255*opacity; 
		    	}
		    }

		}
		ctx1.putImageData(imgData, 0, 0);

		c2.width = self.mapL*5;
		c2.height = self.mapH*5;

		ctx2.mozImageSmoothingEnabled = false;
		ctx2.webkitImageSmoothingEnabled = false;
		ctx2.msImageSmoothingEnabled = false;
		ctx2.imageSmoothingEnabled = false;
		ctx2.drawImage(c1, 0, 0, self.mapL*5, self.mapH*5);
	}

	this.tick = function() {
		self.draw();
		self.ticker = requestAnimationFrame(self.tick);
	}
}

var Ui = function() {
	this.$tracker = $("#tracker");
	this.last = Date.now();
	this.ticker;
 	var self = this;

	this.updateTracker = function(){
		for (var i=-1;i<opponents.opponentNb;i++) {
			var $playerTracker;
			var player;
			if (i==-1)
				player=hero;
			else
				player=opponents.opponents[i];
			
	    	if (self.$tracker.find("#id_"+player.id).length == 0)
	    		self.$tracker.append("<li id='id_"+player.id+"' data-id='"+player.id+"'><div>id:<span>"+player.id+"</span><br/>coord:<span class='coord'></span><br/>attack:<span class='attack'></span><br/>range:<span class='range'></span><br/>food:<span class='food'></span><br/>water:<span class='water'></span><br/>weight:<span class='weight'></span><br/>health:<span class='health'></span><br/>inventory:<span class='inventory'></span><br/>follow:<span><input class='follow' type='checkbox' "+(player.follow?'checked':'')+"></span></div></li>");
	    	
	    	$playerTracker = self.$tracker.find("#id_"+player.id);
	    	$playerTracker.find(".coord").text(player.coordinates.x+", "+player.coordinates.y);
	    	$playerTracker.find(".attack").text(player.attack);
	    	$playerTracker.find(".range").text(player.range);
	    	$playerTracker.find(".food").text(player.food+"/"+player.foodMax);
	    	$playerTracker.find(".water").text(player.water+"/"+player.waterMax);
	    	$playerTracker.find(".weight").text(player.weight+"/"+player.weightMax);
	    	$playerTracker.find(".health").text(player.health+"/"+player.healthMax);
	    	var inventory = "";
	    	for (o in player.inventory) {
	    		inventory+=player.inventory[o].name;
	    	}
	    	$playerTracker.find(".inventory").text(inventory);
	    	$playerTracker.find("input").prop(player.follow?'checked':'');
		}
    };

    this.getInfoCase = function(x,y) {
		self.$tracker.find(".active").removeClass('active');
    	for (var i=-1;i<opponents.opponentNb;i++) {
			var $playerTracker;
			var player;
			if (i==-1)
				player=hero;
			else
				player=opponents.opponents[i];
			if (player.coordinates.x==x && player.coordinates.y==y)
	    		self.$tracker.find("#id_"+player.id).addClass('active');
	    }
    }

    this.bind = function() {
		self.$tracker.on("change", "input.follow[type=checkbox]", function() {
			var id = $(this).parents("li[data-id]").attr("data-id");
			if (id==99)
				hero.follow = $(this).prop("checked");
			else
				opponents.opponents[id].follow = $(this).prop("checked");
		});

		map.$canvas[0].addEventListener('click', function(event) {
			var elemLeft = this.offsetLeft;
    		var elemTop  = this.offsetTop;
		    var x = parseInt((event.pageX - elemLeft)/5,10);
		    var y = parseInt((event.pageY - elemTop)/5,10);
		    self.getInfoCase(x,y);
		},false);
	}

	this.tick = function() {
		//delay
		var delay = 1000;
		if (Date.now()-self.last>delay) {
			self.last = Date.now();
			self.updateTracker();
		}
		self.ticker = requestAnimationFrame(self.tick);
	}

	this.bind();
	this.tick();
}

var GenericItems = function() {
	this.genericItems = new Array();
	var self = this;

	this.generate = function() {
		var i = 0;
		self.genericItems.push(new GenericItem(i++,[{property:"attack",type:"permanent",value:20},{property:"range",type:"permanent",value:2}],1,"spear"));
		self.genericItems.push(new GenericItem(i++,[{property:"health",type:"use",value:100}],1,"medipack"));
		self.genericItems.push(new GenericItem(i++,[{property:"healthMax",type:"permanent",value:150}],1,"armour"));
		self.genericItems.push(new GenericItem(i++,[{property:"attack",type:"permanent",value:30},{property:"range",type:"permanent",value:10}],3,"bow"));
		self.genericItems.push(new GenericItem(i++,[{property:"weightMax",type:"permanent",value:150}],2,"backpack"));
		self.genericItems.push(new GenericItem(i++,[{property:"waterMax",type:"permanent",value:150}],2,"water skin"));
		self.genericItems.push(new GenericItem(i++,[{property:"foodMax",type:"permanent",value:150}],2,"plastic tub"));
	}
	this.generate();
}

var GenericItem = function(id,specs,weight,name) {
	this.id = id;
	this.specs = $.extend(true, [], specs);;
	this.weight = weight;
    this.name = name;
    var self = this;
}

var Items = function(itemNb) {
	this.itemNb = itemNb;
	this.items = new Array();
	var self = this;

	this.generate = function() {
		for (var i=0; i<self.itemNb; i++) {
			var x = getRandom(0,map.mapH-1);
			var y = getRandom(0,map.mapL-1);
			var o = getRandom(0,genericItems.genericItems.length-1);
			self.items.push(new Item($.extend(true, [], genericItems.genericItems[o]),{x:x,y:y},false));
		}
	}

	this.hasItem = function(coordinates) {
		for (i in items.items) {
			if (items.items[i].coordinates.x == coordinates.x && items.items[i].coordinates.y == coordinates.y && !items.items[i].grabbed) {
				items.items[i].grabbed = true;
				return items.items[i];
			}
		}
		return false;
	}
	this.generate();
}

var Item = function(item,coordinates,grabbed) {
	this.id = item.id;
	this.specs = $.extend(true, [], item.specs);
	this.name = item.name;
	this.weight = item.weight;
	this.coordinates = coordinates;
    this.grabbed = grabbed;
    var self = this;
}

var Player = function() {
	this.id;
    this.coordinates;
    this.attack;
    this.range;
    this.food;
    this.foodMax;
    this.water;
    this.waterMax;
    this.weight;
    this.weightMax;
    this.health;
    this.healthMax;
    this.map;
    this.inventory = [];
    this.follow = true;
    var self = this;

    this.init = function(id,coordinates,attack,range,food,water,weight,health,follow) {
    	self.id = id;
    	self.coordinates = {x:coordinates.x,y:coordinates.y};
    	self.attack = attack;
    	self.range = range;
    	self.food = food;
    	self.foodMax = food;
    	self.water = water;
    	self.waterMax = water;
    	self.weight = 0;
    	self.weightMax = weight;
    	self.health = health;
    	self.healthMax = health;
    	self.follow = follow;
    	self.map = $.extend(true, [], map.map);
    }

    this.getItem = function(item) {
    	if (item) {
    		self.inventory.push(item);
    		self.updateWeight(item.weight);
    		for (i in item.specs) {
    			var spec = item.specs[i];
    			if (spec.type=="permanent") {
    				self[spec.property] = Math.max(self[spec.property],spec.value);
    			}
    		}
    	}
    }

    this.updateWeight = function(weight) {
    	self.weight+=weight;
    }

    this.updatePlayer = function(coef) {
    	self.food=Math.max(0,round(self.food-round(coef*map.map[self.coordinates.x][self.coordinates.y].altitude,2),2));
    	if (map.map[self.coordinates.x][self.coordinates.y].type == 1)
    		self.water=Math.max(0,round(self.water-coef,2));
    	else
    		self.water=Math.min(100,round(self.water+5,2));
    	self.checkHealth();
    	self.getItem(items.hasItem(self.coordinates));
    }

    this.checkHealth = function() {
    	if (self.food<5)
    		self.health = Math.max(0,self.health-0.1);
    	if (self.food == 0)
    		self.health = Math.max(0,self.health-0.5);

    	if (self.water==0)
    		self.health = Math.max(0,self.health-0.1);
    }
}

var Hero = function(coordinates) {
	Player.call(this);

	this.delay = 250;
	this.last = Date.now();
	this.keydown = -1;
	this.ticker;

	var self = this;

	self.init(99,coordinates,10,1,100,100,100,100,true);

	this.bind = function() {
		$(document).on("keyup",function(evt) {
			if (map) {
				$(document).on("keydown",function(evt) {
					if (evt.keyCode>36 && evt.keyCode<41)
						self.keydown = evt.keyCode;
				});
				
				$(document).on("keyup",function(evt) {
					if (evt.keyCode == self.keydown && evt.keyCode>36 && evt.keyCode<41)
						self.keydown = -1;
				});
			}
		});
		if (self.ticker)
			cancelAnimationFrame(self.tick);
		self.tick();
	}

	this.tick = function() {
		if (Date.now()-self.last>self.delay) {
			self.last = Date.now();
			if (self.keydown != -1 && map && map.initialized && self.health)
				self.move(self.keydown-37);
			else
				self.updatePlayer(0.1);
		}
		self.ticker = requestAnimationFrame(self.tick);
	}

	this.move = function(direction) {
		$("#"+self.coordinates.x+"_"+self.coordinates.y).removeClass("player");
		switch(direction) {
			case 0 : self.coordinates.y--; break;
			case 1 : self.coordinates.x--; break;
			case 2 : self.coordinates.y++; break;
			case 3 : self.coordinates.x++; break;
		}

		var reset = false;
		if (self.coordinates.y<0) {
			self.coordinates.y=map.mapH-1;
			reset = true;
		}
		if (self.coordinates.y>map.mapH-1) {
			self.coordinates.y=0;
			reset = true;
		}
		if (self.coordinates.x<0) {
			self.coordinates.x=map.mapL-1;
			reset = true;
		}
		if (self.coordinates.x>map.mapL-1) {
			self.coordinates.x=0;
			reset = true;
		}

		self.updatePlayer(0.2);

		if (reset)
			map.create();
		if (fogMode)
			map.lightSurroundingPlayer(-1);
		map.countDiscovery();
	}

	this.bind();
}

var Opponents = function(opponentNb) {
	this.opponentNb = opponentNb;
	this.delayOpponent = 500;
	this.lastOpponentMove = Date.now();
	this.opponents = new Array();
	this.ticker;
	var self = this;

	this.generate = function() {
		for (var i=0; i<self.opponentNb; i++) {
			var x = getRandom(0,map.mapH-1);
			var y = getRandom(0,map.mapL-1);
			self.opponents[i] = new Opponent(i,{x:x,y:y});
		}
		if (self.ticker)
			cancelAnimationFrame(self.tick);
		self.tick();
	}

	this.tick = function() {
		if (Date.now()-self.lastOpponentMove>self.delayOpponent) {
			self.lastOpponentMove = Date.now();
			for (var i=0; i<self.opponentNb; i++) {
				if (self.opponents[i].health) {
					self.opponents[i].move();
					if (fogOpponentsMode)
						map.lightSurroundingPlayer(i);
				}
			}
		}
		self.ticker = requestAnimationFrame(self.tick);
	}

	this.generate();
}

var Opponent = function (id,coordinates){
	Player.call(this);

	var self = this;

	self.init(id,coordinates,10,1,100,100,100,100,true);

    this.move = function(){
		var direction = getRandom(0,8);
		var x = self.coordinates.x;
		var y = self.coordinates.y;
		switch(direction) {
			case 0 : x=x-1; y=y-1; break;
			case 1 : x=x-1; break;
			case 2 : x=x-1; y=y+1; break;
			case 3 : y=y-1; break;
			case 4 : y=y+1; break;
			case 5 : x=x+1; y=y-1; break;
			case 6 : x=x+1; break;
			case 7 : x=x+1; y=y+1; break;
		}

		x = Math.min(map.mapH-1,Math.max(0,x));
		y = Math.min(map.mapH-1,Math.max(0,y));
		self.coordinates.x = x;
		self.coordinates.y = y;
		self.updatePlayer(0.2);
    }
}

$(document).ready(function() {
	
	$("#mapSettings").on("submit",function(evt){
		mapH = parseInt($("input[name=mapHeight]").val(),10);
		mapL = parseInt($("input[name=mapWidth]").val(),10);

		heightMin = parseInt($("input[name=heightMin]").val(),10);
		heightMax = parseInt($("input[name=heightMax]").val(),10);

		if (heightMin > heightMax) {
			$("input[name=heightMin]").val(heightMax);
			$("input[name=heightMax]").val(heightMin);
			heightMin = parseInt($("input[name=heightMin]").val(),10);
			heightMax = parseInt($("input[name=heightMax]").val(),10);
		}

		summitNb = parseInt($("input[name=summitNb]").val(),10);
		lakeNb = parseInt($("input[name=lakeNb]").val(),10);
		riverNb = parseInt($("input[name=riverNb]").val(),10);

		opponentNb = parseInt($("input[name=opponentNb]").val(),10);

		itemNb = parseInt($("input[name=itemNb]").val(),10);


		fogMode = $("input[name=fogMode]").prop("checked");
		fogOpponentsMode = $("input[name=fogOpponentsMode]").prop("checked");
		debugMode = $("input[name=debugMode]").prop("checked");

		map = new Map(mapL,mapH,heightMin,heightMax,summitNb,lakeNb,riverNb,fogMode,fogOpponentsMode);
		map.create();

		genericItems = new GenericItems();
		items = new Items(itemNb);

		Opponent.prototype = Object.create(Player.prototype); 
		Opponent.prototype.constructor = Player;

		opponents = new Opponents(opponentNb);


		Hero.prototype = Object.create(Player.prototype); 
		Hero.prototype.constructor = Player;

		hero = new Hero({x:0,y:0});
		hero.move();

		if (map.ticker)
			cancelAnimationFrame(map.tick);
		map.tick();

		var ui = new Ui();

		map.$map.removeClass("hide");
		
		return false;
	});
});