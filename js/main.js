var map;
var playerX = 0;
var playerY = 0;
var opponentNb = 0;
var debugMode = false;
var opponents = new Array();

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

var Map = function (){
	this.initialized = false;
	this.map  = new Array();
	this.coefLightSize = 2;

    var self = this;

    this.bind = function() {
    	var self = this;
    }

    this.init = function(mapL, mapH, heightMin, heightMax, summitNb, lakeNb, riverNb, fogMode, fogOpponentsMode) {
    	self.mapL = mapL;
		self.mapH = mapH;
		self.heightMin = heightMin;
		self.heightMax = heightMax;

		self.summitNb = summitNb;
		self.lakeNb = lakeNb;
		self.riverNb = riverNb;

		self.fogMode = fogMode;
		self.fogOpponentsMode = fogOpponentsMode;

		self.initialized = true;
    }

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
				self.map[i][j]={type:1, altitude:getRandomNormal(self.heightMin,Math.floor((self.heightMin+self.heightMax)/2)), opacity:self.fogMode?0.1:1};
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

	this.lightSurroundingPlayer = function(x,y) {
		var lightSize=self.map[x][y].altitude*self.coefLightSize;
		for (var i=(x-(lightSize+2));i<=(x+lightSize+2);i++) {
			for (var j=(y-(lightSize+2));j<=(y+lightSize+2);j++) {
				if (i>=0 && i<self.mapL) {
					if (j>=0 && j<self.mapH) {
						var powX = Math.pow(i-x,2);
						var powY = Math.pow(j-y,2);
						if ( powX + powY <= Math.pow(lightSize+2,2) && self.map[i][j].opacity<0.3)
							self.map[i][j].opacity=0.3;
						if ( powX + powY <= Math.pow(lightSize+1,2) && self.map[i][j].opacity<0.5)
							self.map[i][j].opacity=0.5;
						if ( powX + powY < Math.pow(lightSize,2) )
							self.map[i][j].opacity=1;
					}
				}
			}
		}
	}

	this.countDiscovery = function(){
		var discovery =  0;
		for (var i=0;i<self.mapH;i++) {
			for (var j=0;j<self.mapL;j++) {
				discovery+=self.map[i][j].opacity;
			}
		}
	    $("#discovery").text( Math.round( (discovery/self.map.length) * 100)/100+"% discovered");
	}

	this.draw = function() {
		var r = [66,98,68,54,49,38,29,87,74,153,255];
		var g = [198,255,214,181,150,115,79,56,52,153,255];
		var b = [255,66,39,29,29,23,19,43,42,153,255];

		$("#map").html("<canvas></canvas>");
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
		    if (playerX==x && playerY==y) {
				imgData.data[i] = 255; 
	    		imgData.data[i+1] = 0;
	    		imgData.data[i+2] = 0;
	    		imgData.data[i+3] = 255; 
		    }
		    else {
		    	if (self.map[x][y].type==1) {
					imgData.data[i] = r[self.map[x][y].altitude]; 
		    		imgData.data[i+1] = g[self.map[x][y].altitude];
		    		imgData.data[i+2] = b[self.map[x][y].altitude];
		    		imgData.data[i+3] = 255*[self.map[x][y].opacity]; 
		    	}
		    	else {
				    imgData.data[i] = 66; 
		    		imgData.data[i+1] = 198;
		    		imgData.data[i+2] = 255;
		    		imgData.data[i+3] = 255*[self.map[x][y].opacity]; 
		    	}
		    }
		    for (var o=0; o<opponentNb; o++) {
		    	if (opponents[o].coordinates.x == x && opponents[o].coordinates.y == y && opponents[o].health>0) {
					imgData.data[i] = 244; 
		    		imgData.data[i+1] = 66;
		    		imgData.data[i+2] = 194;
		    		imgData.data[i+3] = 255*[self.map[x][y].opacity]; 
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
}


function movePlayer(direction){
	$("#"+playerX+"_"+playerY).removeClass("player");
	switch(direction) {
		case 0 : playerY--; break;
		case 1 : playerX--; break;
		case 2 : playerY++; break;
		case 3 : playerX++; break;
	}

	var reset = false;
	if (playerY<0) {
		playerY=mapH-1;
		reset = true;
	}
	if (playerY>mapH-1) {
		playerY=0;
		reset = true;
	}
	if (playerX<0) {
		playerX=mapL-1;
		reset = true;
	}
	if (playerX>mapL-1) {
		playerX=0;
		reset = true;
	}
	
	if (reset)
		map.create();
	if (fogMode)
		map.lightSurroundingPlayer(playerX,playerY);
	map.countDiscovery();
}

function generateOpponents() {
	for (var i=0; i<opponentNb; i++) {
		var x = getRandom(0,mapH-1);
		var y = getRandom(0,mapL-1);
		opponents[i] = new Opponent({x:x,y:y});
	}
}

var Opponent = function (coordinates){ 
    this.coordinates = {x:coordinates.x,y:coordinates.y};
    this.health = 100;
    var self = this;

    this.bind = function() {

    }

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

		x = Math.min(mapH-1,Math.max(0,x));
		y = Math.min(mapH-1,Math.max(0,y));
		self.coordinates.x = x;
		self.coordinates.y = y;
    }
}


$(document).ready(function() {

	map = new Map();

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


		fogMode = $("input[name=fogMode]").prop("checked");
		fogOpponentsMode = $("input[name=fogOpponentsMode]").prop("checked");
		debugMode = $("input[name=debugMode]").prop("checked");

		map.init(mapL,mapH,heightMin,heightMax,summitNb,lakeNb,riverNb,fogMode,fogOpponentsMode);
		map.create();

		generateOpponents();
		movePlayer();

		var delayOpponent = 500;
		var lastOpponent = Date.now();
		var keydown = -1;

		function ia() { 
			if (Date.now()-lastOpponent>delayOpponent) {
				lastOpponent = Date.now();
				for (var i=0; i<opponentNb; i++) {
					opponents[i].move();
					//moveOpponent(i);
					if (fogOpponentsMode)
						map.lightSurroundingPlayer(opponents[i].coordinates.x,opponents[i].coordinates.y);
				}
			} 
			requestAnimationFrame(ia);
		}

		function draw() {
			map.draw();  
			requestAnimationFrame(draw);
		}
		
		requestAnimationFrame(ia);
		requestAnimationFrame(draw);
		
		return false;
	});

	$(document).on("keyup",function(evt){
		if (map.length>0) {
			var keydown = -1;
			var delay = 250;
			var last = Date.now();

			$(document).on("keydown",function(evt) {
				if (evt.keyCode>36 && evt.keyCode<41)
					keydown = evt.keyCode;
			});
			
			$(document).on("keyup",function(evt) {
				if (evt.keyCode == keydown && evt.keyCode>36 && evt.keyCode<41)
					keydown = -1;
			});

	
			function tick()	{	
				//delay
				if (Date.now()-last>delay) {
					last = Date.now();
					if (keydown != -1 && map && map.initialized)
						movePlayer(keydown-37);
				}
				requestAnimationFrame(tick);
			}
			requestAnimationFrame(tick);
		}
	});
});