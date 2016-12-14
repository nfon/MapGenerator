var map;
var genericItems;
var gameOn=false;
var debugMode = false;

function clearMessage() {
	$("#messages").html("");
}

function displayMessage(msg,color,background) {
	if (debugMode) {
		if (color == undefined)
			color="#000000";
		if (background == undefined)
			background="#FFFFFF";
		$("#messages").append("<span style='background-color:"+background+"; color:"+color+"'>"+msg+"</span></br>");
		$("#messages").scrollTop($("#messages")[0].scrollHeight);
	}
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

function getDistance(coordinates1,coordinates2) {
	return Math.sqrt( Math.pow((coordinates2.x-coordinates1.x),2) + Math.pow((coordinates2.y-coordinates1.y),2) );
}

var Map = function (mapL, mapH, heightMin, heightMax, summitNb, lakeNb, riverNb, fogMode, fogOpponentsMode){
	this.$map = $("#map");
	this.$canvas = this.$map.find("canvas");
	this.map  = new Array();
	this.mapL = mapL;
	this.mapH = mapH;
	this.lavaStep = 0;
	this.lavaDelay = Date.now();;
	this.heightMin = heightMin;
	this.heightMax = heightMax;

	this.summitNb = summitNb;
	this.lakeNb = lakeNb;
	this.riverNb = riverNb;

	this.fogMode = fogMode;
	this.fogOpponentsMode = fogOpponentsMode;
	this.initialized = true;

	this.ticker;

    var self = this;

    this.create = function(){
		clearMessage();
		displayMessage("Map generation","#7FFF00");
		self.generate();
		displayMessage("Creation of the summits","#7FFF00");
		self.generateSummits();
		displayMessage("Creation of the moutains","#7FFF00");
		self.generateMountains();
		displayMessage("Creation of the sources","#7FFF00");
		self.generateLakesSource();
		displayMessage("Creation of the lakes","#7FFF00");
		self.generateLakes();
		displayMessage("Creation of the rivers","#7FFF00");
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
		displayMessage("Generate level "+val,"#7FFF00");
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

		for (var j=Math.max(0,(x-mountainSizeXMin));j<=Math.min(self.mapL-1,(x+mountainSizeXMax));j++) {
			for (var i=Math.max(0,(y-mountainSizeYMin));i<=Math.min(self.mapH-1,(y+mountainSizeYMax));i++) {
				if (x!=j || y!=i) {
					if (self.map[i][j].altitude<val) {
						self.map[i][j].altitude=getRandomNormal(val+1,val-1);
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
		displayMessage("Generate River level "+val,"#7FFF00");
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
		for (var j=Math.max(0,(x-riverSizeXMin));j<=Math.min(self.mapL-1,(x+riverSizeXMax));j++) {
			for (var i=Math.max(0,(y-riverSizeYMin));i<=Math.min(self.mapH-1,(y+riverSizeYMax));i++) {
				if (x!=j || y!=i) {
					if (self.map[i][j].altitude<=val)
						self.map[i][j].type=0;
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
			
			if ( self.map[i][j].type != 0 ) {
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

	this.releaseLava = function() {
		var seuilLvL1 = 3;
		var seuilLvl2 = 4
		for (var i=self.lavaStep;i<self.mapH-self.lavaStep;i++) {
			self.map[i][self.lavaStep].type = 2;
			self.map[i][self.mapL-1-self.lavaStep].type = 2;

			if (getRandom(0,10)<seuilLvL1 && self.lavaStep+1<self.mapH)
				self.map[i][self.lavaStep+1].type = 2;
			if (getRandom(0,10)<seuilLvL1 && self.lavaStep+2<self.mapH)
				self.map[i][self.mapH-2-self.lavaStep].type = 2;

			if (getRandom(0,10)==seuilLvl2 && self.lavaStep+2<self.mapH)
				self.map[i][self.lavaStep+2].type = 2;
			if (getRandom(0,10)==seuilLvl2 && self.lavaStep+3<self.mapH)
				self.map[i][self.mapH-3-self.lavaStep].type = 2;
		}
		for (var j=self.lavaStep;j<self.mapL-self.lavaStep;j++) {
			self.map[self.lavaStep][j].type = 2;
			self.map[self.mapL-1-self.lavaStep][j].type = 2;

			if (getRandom(0,10)<seuilLvL1 && self.lavaStep+1<self.mapL)
				self.map[self.lavaStep+1][j].type = 2;
			if (getRandom(0,10)<seuilLvL1 && self.lavaStep+2<self.mapL)
				self.map[self.mapL-2-self.lavaStep][j].type = 2;

			if (getRandom(0,10)==seuilLvl2 && self.lavaStep+2<self.mapL)
				self.map[self.lavaStep+2][j].type = 2;
			if (getRandom(0,10)==seuilLvl2 && self.lavaStep+3<self.mapL)
				self.map[self.mapL-3-self.lavaStep][j].type = 2;
		}
		self.lavaStep++;
	}

	this.lightSurroundingPlayer = function(o) {
		if (o>=0)
			var player = opponents.opponents[o];
		else
			var player = hero;

		var x = player.coordinates.x;
		var y = player.coordinates.y;

		var lightSize = self.map[x][y].altitude*player.vision;
		for (var i=Math.max(0,(x-(lightSize+2)));i<=Math.min(self.mapL-1,(x+lightSize+2));i++) {
			for (var j=Math.max(0,(y-(lightSize+2)));j<=Math.min(self.mapH-1,(y+lightSize+2));j++) {
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

	this.countDiscovery = function(){
		var discovery =  0;
		for (var i=0;i<self.mapH;i++) {
			for (var j=0;j<self.mapL;j++) {
				discovery+=hero.map[i][j].opacity;
			}
		}
	    $("#discovery").text( round( (discovery/self.map.length),2)+"% discovered");
	}

	this.draw = function() {
		var r = [66,98,68,54,49,38,29,87,74,153,255];
		var g = [198,255,214,181,150,115,79,56,52,153,255];
		var b = [255,66,39,29,29,23,19,43,42,153,255];

		var rLava = [249,249,198];
		var gLava = [150,76,38];
		var bLava = [37,37,1];

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
		    if (self.map[x][y].type==2) {
		    	imgData.data[i] = rLava[getRandomNormal(0,2)];
	    		imgData.data[i+1] = gLava[getRandomNormal(0,2)];
	    		imgData.data[i+2] = bLava[getRandomNormal(0,2)];;
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
	    		self.map[x][y].tempOpacity = opacity;
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
		}

		for (var t in items.items) {
	    	var item = items.items[t];
	    	var x = item.coordinates.x;
	    	var y = item.coordinates.y;
    		var i = x*self.mapL*4 + y*4;
    		if (self.map[x][y].type!=2) {
	    		if (item.grabbed) {
					imgData.data[i] = 255;
	    			imgData.data[i+1] = 140;
	    			imgData.data[i+2] = 0;
	    		}
	    		else {
	    			imgData.data[i] = 255;
	    			imgData.data[i+1] = 215;
	    			imgData.data[i+2] = 0;
	    		}
				imgData.data[i+3] = 255*self.map[x][y].tempOpacity;
			}
	    }

	    for (var o in opponents.opponents) {
	    	var opponent = opponents.opponents[o];
	    	var x = opponent.coordinates.x;
	    	var y = opponent.coordinates.y;
    		var i = x*self.mapL*4 + y*4;
    		if (self.map[x][y].type!=2) {
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
				imgData.data[i+3] = 255*self.map[x][y].tempOpacity;
			}
	    }

	    var x = hero.coordinates.x;
    	var y = hero.coordinates.y;
		var i = x*self.mapL*4 + y*4;

		if (self.map[x][y].type!=2) {
	
			imgData.data[i] = 255;
	    	imgData.data[i+1] = 0;
	    	imgData.data[i+2] = 0;
	    	imgData.data[i+3] = 255;
    		opacity=255;
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
		if (gameOn) {
			if (self.lavaStep) {
				var delay = 5000;
				if (self.lavaStep>=self.mapH/4)
					delay = 10000;
				if (self.lavaStep>=self.mapH/3)
					delay = 10000000000;

				if ((Date.now()-self.lavaDelay>delay) ) {
					self.releaseLava();
					self.lavaDelay = Date.now();
				}
			}

			
			self.draw();
			self.ticker = requestAnimationFrame(self.tick);
		}
	}
}

var Ui = function() {
	this.$board = $("#board");
	this.$tracker = $("#tracker");
	this.last = Date.now();
	this.ticker;
 	var self = this;

	this.updateTracker = function(){
		var playerAlive = [];
		for (var i=-1;i<opponents.opponentNb;i++) {
			var $playerTracker;
			var player;
			if (i==-1)
				player=hero;
			else
				player=opponents.opponents[i];
			
	    	if (self.$tracker.find("#id_"+player.id).length == 0)
	    		self.$tracker.append("<li id='id_"+player.id+"' data-id='"+player.id+"' class='ui'><div>id:<span>"+player.id+"</span><br/>name:<span>"+player.name+"</span><br/>coord:<span class='coord'></span><br/>attack:<span class='attack'></span><br/>range:<span class='range'></span><br/>food:<div class='percent'><span class='food'></span></div>water:<div class='percent'><span class='water'></span></div>weight:<div class='percent'><span class='weight'></span></div>health:<div class='percent'><span class='health'></span></div>inventory:<span class='inventory'></span><br/>follow:<span><input class='follow' type='checkbox' "+(player.follow?'checked':'')+"></span></div></li>");
	    	
	    	$playerTracker = self.$tracker.find("#id_"+player.id);
	    	if (player.health==0) {
	    		$playerTracker.addClass("dead");
	    		$playerTracker.find(".health").text(player.health+"/"+player.healthMax).css("width",player.health*100/player.healthMax);
	    	}
	    	else {
	    		playerAlive.push(player);
	    		$playerTracker.find(".coord").text(player.coordinates.x+", "+player.coordinates.y);
	    		$playerTracker.find(".attack").text(player.attack);
	    		$playerTracker.find(".range").text(player.range);
	    		$playerTracker.find(".food").text(player.food+"/"+player.foodMax).css("width",player.food*100/player.foodMax);
	    		$playerTracker.find(".water").text(player.water+"/"+player.waterMax).css("width",player.water*100/player.waterMax);
	    		$playerTracker.find(".weight").text(player.weight+"/"+player.weightMax).css("width",player.weight*100/player.weightMax);
	    		$playerTracker.find(".health").text(player.health+"/"+player.healthMax).css("width",player.health*100/player.healthMax);
	    	}
	    	var inventory = "";
	    	for (o in player.inventory) {
	    		inventory+=player.inventory[o].name+", ";
	    	}
	    	if (inventory.length)
	    		inventory = inventory.substring(0,inventory.length-2);
	    	else
	    		inventory = "/";
	    	$playerTracker.find(".inventory").text(inventory);
	    	$playerTracker.find("input").prop(player.follow?'checked':'');
		}
		if (playerAlive.length==1) {
			self.$board.find("#alive").text("WINNER : "+playerAlive[0].name+ "("+playerAlive[0].id+")");
			displayMessage(playerAlive[0].name+" wins!","#000000","FFD700");
			gameOn=false;
		}
		else
			self.$board.find("#alive").text(playerAlive.length+" players alive");
    }

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
	    for (var o in items.items) {
	    	if (items.items[o].coordinates.x == x && items.items[o].coordinates.y == y)
	    		displayMessage(items.items[o]);
	    }
    }

    this.clean = function() {
    	self.$tracker.html("");
    	self.$board.find("#alive").html("");
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
		if (gameOn) {
			var delay = 1000;
			if (Date.now()-self.last>delay) {
				self.last = Date.now();
				self.updateTracker();
			}
			self.ticker = requestAnimationFrame(self.tick);
		}
	}

	this.clean();
	this.bind();
	this.tick();
}

var Sounds = function() {
	this.sounds = [];
	var self = this;

	this.init = function() {
		self.sounds["canon"] = new Sound("#canon");
	}
	self.init();
}

var Sound = function(elem) {
	this.$elem = $(elem)[0];
	var self = this;

	this.play = function() {
		self.$elem.currentTime = 0;
		self.$elem.play();
	}

	this.stop = function() {
		self.$elem.pause();
	}
}

var GenericItems = function() {
	this.genericItems = new Array();
	var self = this;

	this.generate = function() {
		var i = 0;
		self.genericItems.push(new GenericItem(i++,"health",[{property:"health",type:"use",value:50}],1,"small medipack"));
		self.genericItems.push(new GenericItem(i++,"health",[{property:"health",type:"use",value:100}],1.5,"medipack"));
		self.genericItems.push(new GenericItem(i++,"health",[{property:"health",type:"use",value:200}],2,"large medipack"));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:20,range:2,accuracy:1},1,"spear"));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:30,range:2,accuracy:1},1,"sword"));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:30,range:10,accuracy:0.6},3,"bow"));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:40,range:7,accuracy:0.8},0.5,"gun"));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:70,range:3,accuracy:0.2},3,"shotgun"));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:50,range:20,accuracy:0.8},4,"longneck"));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:80,range:20,accuracy:0.6},8,"bazooka"));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"healthMax",type:"permanent",value:150}],1,"armour"));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"vision",type:"permanent",value:3}],1,"binocular"));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"weightMax",type:"permanent",value:50}],2,"backpack"));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"waterMax",type:"cumul",value:50}],2,"water skin"));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"foodMax",type:"cumul",value:50}],2,"plastic tub"));
	}
	this.generate();
}

var GenericItem = function(id,type,specs,weight,name) {
	this.id = id;
	this.type = type;
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
		for (var i in items.items) {
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
	this.type = item.type;
	this.specs = $.extend(true, [], item.specs);
	this.name = item.name;
	this.weight = item.weight;
	this.coordinates = coordinates;
    this.grabbed = grabbed;
    var self = this;
}

var Player = function() {
	this.id;
	this.name;
    this.coordinates;
    this.vision;
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
    this.gathering;
    this.map;
    this.inventory = [];
    this.follow = true;
    var self = this;

    this.init = function(id,name,coordinates,vision,attack,accuracy,range,food,foodLimit,water,waterLimit,weight,health,healthLimit,gathering,follow) {
    	self.id = id;
    	self.name = name;
    	self.coordinates = {x:coordinates.x,y:coordinates.y};
    	self.vision = vision;
    	self.attack = attack;
    	self.accuracy = accuracy;
    	self.range = range;
    	self.food = food;
    	self.foodMax = food;
    	self.foodLimit = foodLimit;
    	self.water = water;
    	self.waterLimit = waterLimit;
    	self.waterMax = water;
    	self.weight = 0;
    	self.weightMax = weight;
    	self.health = health;
    	self.healthLimit = healthLimit;
    	self.healthMax = health;
    	this.gathering = gathering;
    	self.follow = follow;
    	self.map = $.extend(true, [], map.map);
    }

    this.setPosition = function(x,y) {
    	self.coordinates={x:x,y:y};
    }

    this.getItem = function(item) {
    	if (item) {
    		if ( (item.specs[0] && ( item.specs[0].type=="use" || item.specs[0].type=="cumul") ) || !self.hasItem(item.id) ) {
	    		displayMessage(self.name+" ("+self.id+") get item "+item.name,"#FFD700");
	    		if (item.weight+self.weight<=self.weightMax) {
		    		self.inventory.push(item);
		    		self.updateWeight(item.weight);
		    		if (item.type=="object") {
			    		for (var i in item.specs) {
			    			var spec = item.specs[i];
			    			if (spec.type=="permanent") {
			    				self[spec.property] = Math.max(self[spec.property],spec.value);
			    			}
			    			if (spec.type=="cumul") {
			    				self[spec.property] += spec.value;
			    			}
			    		}
			    	}
			    	return true;
		    	}
		    }
    	}
    	return false;
    }

    this.getInventory = function(player) {
    	if (player) {
    		if (player.inventory.length) {
	    		displayMessage(self.name+" ("+self.id+") stealing "+player.name+" ("+player.id+")'s inventory","#FFD700");
	    		for (i in player.inventory) {
		    		self.getItem(player.inventory[i]);
    				player.inventory.pop(player.inventory[i]);//empty the inventory so no one can steal what is left
	    		}
	    	}
	    }
    }

    this.hasItem = function(id) {
    	var result = [];
    	if (self.inventory.length)
    		result = $.grep(self.inventory, function(e){ return e.id == id; });
    	return result.length;
    }

    this.useItem = function(id) {
    	var item = $.grep(self.inventory, function(e){ return e.id == id; })[0];
    	for (var i in item.specs) {
			var spec = item.specs[i];
			if (spec.type=="use")
				self[spec.property] = Math.min(self[spec.property+"Max"],self[spec.property]+spec.value);
		}
    	displayMessage(self.name+" ("+self.id+") used "+item.name,"#FFD700");
		self.updateWeight(-item.weight);
		self.inventory.pop(item);
    }

    this.updateWeight = function(weight) {
    	self.weight+=weight;
    }

    this.updatePlayer = function(coef) {
    	if (self.health) {
    		self.food=Math.max(0,round(self.food-round(coef*map.map[self.coordinates.x][self.coordinates.y].altitude,2),2));
    		if (map.map[self.coordinates.x][self.coordinates.y].type == 1)
	    		self.water=Math.max(0,round(self.water-coef,2));
    		if (map.map[self.coordinates.x][self.coordinates.y].type==2)
    			self.health = Math.max(0,self.health-50);
    		self.checkHealth();
    		self.getItem(items.hasItem(self.coordinates));
    		self.getInventory(self.hasOpponent(0,self.coordinates));

    	}
    }

    this.hasOpponent = function(status,coordinates) {
    	//status :
    	//0: death
    	//1: alive
    	//2: either
		for (var o=-1;o<opponents.opponentNb;o++) {
			var player;
			if (o==-1)
				player=hero;
			else
				player=opponents.opponents[o];

			if (player.id!=self.id && player.coordinates.x == coordinates.x && player.coordinates.y == coordinates.y)
				if (status==0 && player.health==0 || status==1 && player.health>0 || status==2)
					return player;
		}
		return false;
	}

    this.getClosedOpponents = function(status) {
    	//status :
    	//0: death
    	//1: alive
    	//2: either
    	var x = self.coordinates.x;
		var y = self.coordinates.y;
		var range = map.map[x][y].altitude*self.vision;

		var closedOpponents = [];
		
		for (var i=Math.max(0,(x-range));i<=Math.min(map.mapL-1,(x+range));i++) {
			for (var j=Math.max(0,(y-range));j<=Math.min(map.mapH-1,(y+range));j++) {
				var powX = Math.pow(i-x,2);
				var powY = Math.pow(j-y,2);
				if ( powX + powY < Math.pow(range,2) ) {
					for (var o=-1;o<opponents.opponentNb;o++) {
						var player;
						if (o==-1)
							player=hero;
						else
							player=opponents.opponents[o];

						if (player.id != self.id) {
							if (status==0 && player.health==0 || status==1 && player.health || status==2) {
								if (player.coordinates.x == i && player.coordinates.y == j)
									closedOpponents.push({player:player,distance:getDistance(player.coordinates,self.coordinates)});
							}
						}
					}							
				}
			}
		}


		closedOpponents.sort(function(a, b) {
		    return a.distance - b.distance;
		});

		return closedOpponents;
    }

    this.getClosedItems = function() {
    	var x = self.coordinates.x;
		var y = self.coordinates.y;
		var range = map.map[x][y].altitude*self.vision;

		var closedItems = [];

		var itemsAvailable = items.items.filter(function(item){
			return item.grabbed==false;
		});
		
		for (var i=Math.max(0,(x-range));i<=Math.min(map.mapL-1,(x+range));i++) {
			for (var j=Math.max(0,(y-range));j<=Math.min(map.mapH-1,(y+range));j++) {
				var powX = Math.pow(i-x,2);
				var powY = Math.pow(j-y,2);
				if ( powX + powY < Math.pow(range,2) ) {
					for (var o in itemsAvailable) {
						var item = itemsAvailable[o];
						if (item.coordinates.x == i && item.coordinates.y == j)
							closedItems.push({item:item,distance:getDistance(item.coordinates,self.coordinates)});
					}							
				}
			}
		}


		closedItems.sort(function(a, b) {
		    return a.distance - b.distance;
		});

		return closedItems;
    }

    this.getClosedLava = function() {
    	var x = self.coordinates.x;
		var y = self.coordinates.y;
		var range = map.map[x][y].altitude*self.vision;

		var closedLava = [];
		
		for (var i=Math.max(0,(x-range));i<=Math.min(map.mapL-1,(x+range));i++) {
			for (var j=Math.max(0,(y-range));j<=Math.min(map.mapH-1,(y+range));j++) {
				var powX = Math.pow(i-x,2);
				var powY = Math.pow(j-y,2);
				if ( powX + powY < Math.pow(range,2) )
					if (map.map[i][j].type==2)
						closedLava.push({coordinates:{x:i,y:j},distance:getDistance({x:i,y:j},self.coordinates)});
			}
		}


		closedLava.sort(function(a, b) {
		    return a.distance - b.distance;
		});

		return closedLava;
    }

    this.getDirection = function(coordinates) {
    	var direction;
    	var deltaX = self.coordinates.x - coordinates.x;
    	var deltaY = self.coordinates.y - coordinates.y;
    	
    	if (deltaX != 0) {
    		if (deltaY != 0) {
    			if (deltaX > 0) {
    				if (deltaY > 0)
    					direction = 0;
    				else
    					direction = 5;
    			}
    			else {
					if (deltaY > 0)
    					direction = 2;
    				else
    					direction = 7;
    			}
    		}
    		else {
    			if (deltaX > 0)
					direction = 3;
    			else
					direction = 4;
    		}
    	}
    	else {
    		if (deltaY > 0)
				direction = 1;
			else	
				direction = 6;
    	}
    	return direction;
    }

    this.getReverseDirection = function(direction) {
    	return 7-direction;
    }

    this.checkSurroundings = function() {

		var closedOpponents = self.getClosedOpponents(1);

		if (closedOpponents.length) {			
			var attack = self.attack;
	    	var range = self.range;
	    	var damage = round(self.attack*self.accuracy*self.range/Math.max(1,closedOpponents[0].distance),2);
	    	var bestWeapon = {name:"fist"};

	    	var weapons = self.inventory.filter(function(item){
	    		return item.type=="weapon";
	    	});
	    	for (var w in weapons) {
	    		var weapon = weapons[w];
    			if (weapon.specs.range <= closedOpponents[0].distance) {
	    			var tempAttack = weapon.specs.attack;
	    			var tempRange = weapon.specs.range;
	    			var tempAccuracy = weapon.specs.accuracy;
	    			var tempDamage = 0;

	    			tempDamage = tempAttack*tempAccuracy*(tempRange/Math.max(1,closedOpponents[0].distance));

	    			if (tempDamage>damage) {
	    				damage = round(tempDamage,2);
	    				bestWeapon = weapon;
	    			}
    			}
			}
			displayMessage(self.name+" ("+self.id+") used "+bestWeapon.name+" on "+closedOpponents[0].player.name+" ("+closedOpponents[0].player.id+") and caused "+damage+" on "+closedOpponents[0].player.health,"#B22222");
			closedOpponents[0].player.health = Math.max(0,round( round(closedOpponents[0].player.health,2) - damage,2));
			if (closedOpponents[0].player.health==0) {
    			sounds.sounds["canon"].play();
				displayMessage(self.name+" ("+self.id+") killed "+closedOpponents[0].player.name+" ("+closedOpponents[0].player.id+")","#B22222","#000000");
			}

		}
    }

    this.eat = function() {
    	var foodAvailable = map.map[self.coordinates.x][self.coordinates.y].food;
    	var foodTaken = round(foodAvailable*self.gathering,2);
    	map.map[self.coordinates.x][self.coordinates.y].food=Math.max(0,foodAvailable-foodTaken);
    	self.food=Math.min(self.foodMax,self.food+foodTaken);
    }

    this.drink = function() {
    	self.water=self.waterMax;
    }


    this.checkHealth = function() {
    	if (self.hasItem(0) && (self.health<self.healthMax-50  || self.health < self.healthLimit) )
    		self.useItem(0);
    	if (self.hasItem(1) && (self.health<self.healthMax-100 || self.health < self.healthLimit) )
    		self.useItem(1);
    	if (self.hasItem(2) && (self.health<self.healthMax-200 || self.health < self.healthLimit) )
    		self.useItem(2);
    	if (self.food<5)
    		self.health = Math.max(0,round(self.health-0.1,2));
    	if (self.food == 0)
    		self.health = Math.max(0,round(self.health-0.5,2));
    	if (self.water==0)
    		self.health = Math.max(0,round(self.health-0.1,2));
    	if (self.health==0)
    	{
    		sounds.sounds["canon"].play();
			displayMessage(self.name+" ("+self.id+") died","#B22222","#000000");
    	}
    }
}

var Hero = function(name,coordinates) {
	Player.call(this);

	this.delay = 250;
	this.last = Date.now();
	this.keydown = -1;
	this.ticker;

	var self = this;
	self.init(99,name,coordinates,2,10,0.3,1,100,20,100,20,20,100,25,1,true);

	this.bind = function() {
		$(document).on("keyup",function(evt) {
			if (map) {
				$(document).on("keydown",function(evt) {
					if (evt.keyCode>36 && evt.keyCode<41)
					{
						self.keydown = evt.keyCode;
						return false;
					}
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
		if (gameOn) {
			if (Date.now()-self.last>self.delay && self.health) {
				self.last = Date.now();
				if (self.keydown != -1 && map && map.initialized && self.health)
					self.move(self.keydown-37);
				else
				{
					if (map.map[self.coordinates.x][self.coordinates.y].type==0)
						self.drink();
					else
						self.eat();

					self.updatePlayer(0.1);
				}
				self.checkSurroundings();
			}
			self.ticker = requestAnimationFrame(self.tick);
		}
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
	this.opponents = [];
	this.ticker;
	var self = this;

	this.generate = function() {
		var names = chance.unique(chance.first, self.opponentNb);
		for (var i=0; i<self.opponentNb; i++) {
			var x = getRandom(0,map.mapH-1);
			var y = getRandom(0,map.mapL-1);
			self.opponents[i] = new Opponent(i,names[i],{x:x,y:y});
		}
		if (self.ticker)
			cancelAnimationFrame(self.tick);
		self.tick();
	}

	this.tick = function() {
		if (gameOn) {
			if (Date.now()-self.lastOpponentMove>self.delayOpponent) {
				self.lastOpponentMove = Date.now();
				for (var i=0; i<self.opponentNb; i++) {
					if (self.opponents[i].health) {
						if (self.opponents[i].food < self.opponents[i].foodLimit && map.map[self.opponents[i].coordinates.x][self.opponents[i].coordinates.y].food > 0) {
							self.opponents[i].eat();
							self.opponents[i].updatePlayer(0.1);
						}
						else {
							if (self.opponents[i].water < self.opponents[i].waterLimit && map.map[self.opponents[i].coordinates.x][self.opponents[i].coordinates.y].type == 0) {
								self.opponents[i].drink();
								self.opponents[i].updatePlayer(0.1);
							}
							else {
								self.opponents[i].move();
								if (fogOpponentsMode)
									map.lightSurroundingPlayer(i);
							}
						}
						self.opponents[i].checkSurroundings();
					}
				}
			}
			self.ticker = requestAnimationFrame(self.tick);
		}
	}

	this.generate();
}

var Opponent = function (id,name,coordinates) {
	Player.call(this);

	var self = this;
	self.init(id,name,coordinates,2,10,0.3,1,100,20,100,20,20,100,25,1,true);

    this.move = function() {
    	var direction = getRandom(0,8);
    	var closedLava = self.getClosedLava();
    	if (closedLava.length)
			direction = self.getReverseDirection(self.getDirection(closedLava[0].coordinates));
    	else {
	    	var closedOpponents = self.getClosedOpponents(2);
	    	if (closedOpponents.length) {
	    		if (closedOpponents[0].player.health) {
					direction = self.getDirection(closedOpponents[0].player.coordinates);
	    			if (self.health<=self.healthLimit)
	    				direction = self.getReverseDirection(direction);
	    		}
	    		else {
	    			if (closedOpponents[0].player.inventory.length)
						direction = self.getDirection(closedOpponents[0].player.coordinates);
	    		}
	    	}
	    	else {
	    		var closedItems = self.getClosedItems();//warning : if the player is fully loaded he will probably stay static
	    		if (closedItems.length)
	    			direction = self.getDirection(closedItems[0].item.coordinates);
	    	}
	    }

		var x = self.coordinates.x;
		var y = self.coordinates.y;
		switch(direction) {
			case 0 : x=x-1; y=y-1; break;
			case 1 : y=y-1; break;
			case 2 : x=x-1; y=y-1; break;
			case 3 : x=x-1; break;
			case 4 : x=x+1; break;
			case 5 : x=x-1; y=y+1; break;
			case 6 : y=y+1; break;
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
	$("#lava").on("click",function(){
		map.releaseLava();
	});
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

		gameOn = true;

		map = new Map(mapL,mapH,heightMin,heightMax,summitNb,lakeNb,riverNb,fogMode,fogOpponentsMode);
		map.create();

		genericItems = new GenericItems();
		items = new Items(itemNb);

		Opponent.prototype = Object.create(Player.prototype); 
		Opponent.prototype.constructor = Player;

		opponents = new Opponents(opponentNb);


		Hero.prototype = Object.create(Player.prototype); 
		Hero.prototype.constructor = Player;

		var name = $("input[name=name]").val();
		hero = new Hero(name,{x:0,y:0});
		hero.move();

		if (map.ticker)
			cancelAnimationFrame(map.tick);
		map.tick();

		sounds = new Sounds();
		var ui = new Ui();

		map.$map.removeClass("hide");
		
		return false;
	});
});