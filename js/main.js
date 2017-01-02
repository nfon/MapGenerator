var game;

function clearMessage() {
	$("#messages").html("");
}

function displayMessage(msg,color,background) {
	if (game.debugMode) {
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

function modal(closabled, title, body, btn1, btn2, fct1, fct2) {
	var $modal = $("#modal");
	if (closabled)
		$modal.find(".closable").show();
	else
		$modal.find(".closable").hide();
	$modal.find("#modalLabel").html(title);
	$modal.find("#modalBody").html(body);
	$modal.modal();
	$modal.data('bs.modal').options.backdrop = closabled?true:'static'; //out of the init else the backdrop won't be changed after the first init
	$modal.data('bs.modal').options.keyboard = !closabled; //out of the init else the backdrop won't be changed after the first init

	$modal.find(".modal-footer>button").off();
	if (closabled) 
		$modal.find(".modal-footer>button.btn-primary").text(btn1).on("click",fct1);
	$modal.find(".modal-footer>button.btn-primary").text(btn2).on("click",fct2);
}

function closeModal() {
	var $modal = $("#modal");
	$modal.modal("toggle");
}

function getForm(name,value,min,max,step) {
	return "<div class='form-group'>"+
		"<label for='"+name+"' class='col-sm-2 control-label'>"+name.charAt(0).toUpperCase()+name.slice(1)+"</label>"+
		"<div class='col-sm-8 input-group'>"+
		"<span class='input-group-btn'><button class='btn btn-white btn-minuse' type='button'>-</button></span>"+
		"<input type='number' class='form-control no-padding text-center' min='"+min+"' max='"+max+"' step='"+step+"' name='"+name+"' origin='"+value+"' value='"+value+"'>"+
		"<span class='input-group-btn'><button class='btn btn-red btn-pluss' type='button'>+</button></span>"+
		"</div></div>";
}

var Map = function (mapL, mapH, heightMin, heightMax, summitNb, lakeNb, riverNb, fogMode, fogOpponentsMode){
	this.$map = $("#map");
	this.$canvas = this.$map.find("canvas");
	this.map  = new Array();
	this.mapL = mapL;
	this.mapH = mapH;
	this.lavaStep = 0;
	this.lavaDelay = Date.now();
	this.rainStep = 0;
	this.rainDelay = Date.now();
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
		for (var i=0;i<self.mapL;i++) {
			self.map[i] = new Array();
			for (var j=0;j<self.mapH;j++) {
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
			var x = getRandom(0,self.mapL-1);
			var y = getRandom(0,self.mapH-1);
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
		for (var i=0;i<self.mapL;i++) {
			for (var j=0;j<self.mapH;j++) {
				if (self.map[i][j].altitude==val) {
					self.changeSurroundings(i,j,val-1);
				}
			}
		}
	}

	this.changeSurroundings = function(x,y,val) {
		var mountainSizeXMin=getRandomNormal(0,5);
		var mountainSizeXMax=getRandomNormal(0,5);
		var mountainSizeYMin=getRandomNormal(0,5);
		var mountainSizeYMax=getRandomNormal(0,5);

		for (var i=Math.max(0,(x-mountainSizeXMin));i<=Math.min(self.mapL-1,(x+mountainSizeXMax));i++) {
			for (var j=Math.max(0,(y-mountainSizeYMin));j<=Math.min(self.mapH-1,(y+mountainSizeYMax));j++) {
				if (x!=i || y!=j) {
					if (self.map[i][j].altitude<val) {
						self.map[i][j].altitude=getRandomNormal(val+1,val-1);
					}
				}
			}
		}
	}

	this.generateLakesSource = function() {
		for (var i=0;i<self.lakeNb;i++) {
			var x = getRandom(0,self.mapL-1);
			var y = getRandom(0,self.mapH-1);
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
		for (var i=0;i<self.mapL;i++) {
			for (var j=0;j<self.mapH;j++) {
				if (self.map[i][j].type==0 && self.map[i][j].altitude==val) {
					self.changeSurroundingsLake(i,j,val);
				}
			}
		}
	}

	this.changeSurroundingsLake = function(x,y,val) {
		var riverSizeXMin=getRandomNormal(0,4);
		var riverSizeXMax=getRandomNormal(0,3);
		var riverSizeYMin=getRandomNormal(0,4);
		var riverSizeYMax=getRandomNormal(0,3);
		for (var i=Math.max(0,(x-riverSizeXMin));i<=Math.min(self.mapL-1,(x+riverSizeXMax));i++) {
			for (var j=Math.max(0,(y-riverSizeYMin));j<=Math.min(self.mapH-1,(y+riverSizeYMax));j++) {
				if (x!=i || y!=j) {
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
					var x = self.mapL-1;
					orientation=2;
				}

				var y = getRandom(0,self.mapH-1);
			}
			else {
				if (getRandom(0,1)) {
					var y = 0;
					orientation=3;
				}
				else {
					var y = self.mapH-1;	
					orientation=1;			
				}

				var x = getRandom(0,self.mapL-1);
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


			i = Math.min(self.mapL-1,Math.max(0,i));
			j = Math.min(self.mapH-1,Math.max(0,j));
			

			if ( ( /*self.map[i][j]<0 ||*/ i==0 || i==mapL-1 || j==0 || j==self.mapH-1 ) && length > 5 )
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
		//var seuilLvl2 = 4;

		var lavaSize = self.mapL*Math.sqrt(2)/2-2-self.lavaStep;

		for (var i=0;i<=self.mapL-1;i++) {
			for (var j=0;j<=self.mapH-1;j++) {
				var powX = Math.pow(i-Math.round(self.mapL/2),2);
				var powY = Math.pow(j-Math.round(self.mapH/2),2);
				if ( powX + powY > Math.pow(lavaSize+2,2) )
					self.map[i][j].type = 2;
				if (getRandom(0,10)<seuilLvL1) {
					if ( powX + powY > Math.pow(lavaSize,2) )
						self.map[i][j].type = 2;
				}
			}
		}


/*
		for (var i=self.lavaStep;i<self.mapL-self.lavaStep;i++) {
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
		for (var j=self.lavaStep;j<self.mapH-self.lavaStep;j++) {
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
*/
		self.lavaStep++;
	}

	this.rain = function() {
		if (self.rainStep==0)
    		game.sounds.sounds["rain"].play();
		if (self.rainStep<3)
			self.rainStep++;
		else
		{
			for (var o in game.opponents.opponents) {
    			var opp = game.opponents.opponents[o];
    			opp.water=opp.waterMax;
			}
    		game.sounds.sounds["rain"].stop();
			self.generateLakes();
			self.rainStep=0;
		}
	}

	this.getDirection = function(origin,coordinates) {
    	var direction;
    	var deltaX = origin.x - coordinates.x;
    	var deltaY = origin.y - coordinates.y;
    	
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

	this.lightSurroundingPlayer = function(o) {
		if (o>=0)
			var player = game.opponents.opponents[o];
		else
			var player = game.hero;

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
		for (var i=0;i<self.mapL;i++) {
			for (var j=0;j<self.mapH;j++) {
				discovery+=game.hero.map[i][j].opacity;
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

		var rRain = [66,84,93];
		var gRain = [198,183,203];
		var bRain = [255,214,237];

		var c2 = $("#map>canvas")[0];
		var ctx2 = c2.getContext("2d");

		var c1 = document.createElement("canvas");
		c1.width = self.mapL;
		c1.height = self.mapH;
		var ctx1 = c1.getContext("2d");

		var imgData = ctx1.createImageData(self.mapL, self.mapH);

		for (var i=0; i<imgData.data.length; i+=4) {
		    var x = (i/4)%self.mapL;
		    var y = Math.floor(i/4/self.mapL);
		    var opacity = self.map[x][y].opacity;
		    
	    	if (self.fogMode && game.hero && game.hero.follow)
	    		opacity = Math.max(opacity,game.hero.map[x][y].opacity);
	    	if (self.fogOpponentsMode) {
	    		for (var o=0; o<game.opponents.playerNb; o++) {
	    			if (game.opponents.opponents[o].follow)
	    				opacity = Math.max(opacity,game.opponents.opponents[o].map[x][y].opacity);
	    		}
    		}
    		self.map[x][y].tempOpacity = opacity;

    		if (self.map[x][y].type==2) {
		    	imgData.data[i] = rLava[getRandomNormal(0,2)];
	    		imgData.data[i+1] = gLava[getRandomNormal(0,2)];
	    		imgData.data[i+2] = bLava[getRandomNormal(0,2)];
	    		imgData.data[i+3] = 255*opacity;
		    }
		    else {
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

		for (var t in game.items.items) {
	    	var item = game.items.items[t];
	    	var x = item.coordinates.x;
	    	var y = item.coordinates.y;
    		var i = y*self.mapL*4 + x*4;

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

	    for (var o in game.opponents.opponents) {
	    	var opponent = game.opponents.opponents[o];
	    	var x = opponent.coordinates.x;
	    	var y = opponent.coordinates.y;
    		var i = y*self.mapL*4 + x*4;
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

	    if (game.hero) {
	    	var x = game.hero.coordinates.x;
    		var y = game.hero.coordinates.y;
    		var i = y*self.mapL*4 + x*4;

			if (self.map[x][y].type!=2) {
		
				imgData.data[i] = 255;
		    	imgData.data[i+1] = 0;
		    	imgData.data[i+2] = 0;
		    	imgData.data[i+3] = 255;
	    	}
	    }

	    if (self.rainStep) {
			for (var i=4; i<imgData.data.length; i+=4) {
			    var x = (i/4)%self.mapL;
			    var y = Math.floor(i/4/self.mapL);
			    var opacity = self.map[x][y].tempOpacity;

			    if (getRandom(0,10)<4-self.rainStep) {
	    			imgData.data[i] = rRain[getRandomNormal(0,2)];
	    			imgData.data[i+1] = gRain[getRandomNormal(0,2)];
	    			imgData.data[i+2] = bRain[getRandomNormal(0,2)];
	    			imgData.data[i+3] = 255*opacity;
	    		}
		    }
	    }
		
	    var ships = game.ships.ships.filter(function(ship){
			return ship.on==true;
		});

		if (ships.length) {
			var color = [[0,0,0],[144,144,144]];
			/*
			[0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7]
			[_,_,_,0,0,_,_,_,_,_,_,_,_,_,_,_,_,_]
			[_,_,_,_,0,0,0,_,_,_,_,_,_,_,_,_,_,_]
			[_,_,_,_,0,1,0,0,0,_,_,_,_,_,_,_,_,_]
			[_,0,_,_,_,0,1,1,0,0,0,_,_,_,_,_,_,_]
			[_,_,0,0,_,0,0,1,1,1,0,0,0,_,_,_,_,_]
			[_,_,_,_,0,_,0,1,0,1,1,1,0,0,_,_,_,_]
			[0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,_,_]
			[0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,_]
			[0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,_,_]
			[_,_,_,_,0,_,0,1,0,1,1,1,0,0,_,_,_,_]
			[_,_,0,0,_,0,0,1,1,1,0,0,0,_,_,_,_,_]
			[_,0,_,_,_,0,1,1,0,0,0,_,_,_,_,_,_,_]
			[_,_,_,_,0,1,0,0,0,_,_,_,_,_,_,_,_,_]
			[_,_,_,_,0,0,0,_,_,_,_,_,_,_,_,_,_,_]
			[_,_,_,0,0,_,_,_,_,_,_,_,_,_,_,_,_,_]
			*/


			var ship_model = [{x:3,y:0,color:0},{x:4,y:0,color:0},
			 {x:4,y:1,color:0},{x:5,y:1,color:0},{x:6,y:1,color:0},
			 {x:4,y:2,color:0},{x:5,y:2,color:1},{x:6,y:2,color:0},{x:7,y:2,color:0},{x:8,y:2,color:0},
			 {x:1,y:3,color:0},{x:5,y:3,color:0},{x:6,y:3,color:1},{x:7,y:3,color:1},{x:8,y:3,color:0},{x:9,y:3,color:0},{x:10,y:3,color:0},
			 {x:2,y:4,color:0},{x:3,y:4,color:0},{x:5,y:4,color:0},{x:6,y:4,color:0},{x:7,y:4,color:1},{x:8,y:4,color:1},{x:9,y:4,color:1},{x:10,y:4,color:0},{x:11,y:4,color:0},{x:12,y:4,color:0},
			 {x:4,y:5,color:0},{x:6,y:5,color:0},{x:7,y:5,color:1},{x:8,y:5,color:0},{x:9,y:5,color:1},{x:10,y:5,color:1},{x:11,y:5,color:1},{x:12,y:5,color:0},{x:13,y:5,color:0},
			
			 {x:0,y:6,color:0},{x:1,y:6,color:0},{x:2,y:6,color:0},{x:3,y:6,color:0},{x:4,y:6,color:0},{x:5,y:6,color:0},{x:6,y:6,color:0},{x:7,y:6,color:0},{x:8,y:6,color:1},{x:9,y:6,color:1},{x:10,y:6,color:1},{x:11,y:6,color:1},{x:12,y:6,color:1},{x:13,y:6,color:0},{x:14,y:6,color:0},{x:15,y:6,color:0},
			 {x:0,y:7,color:0},{x:1,y:7,color:1},{x:2,y:7,color:0},{x:3,y:7,color:1},{x:4,y:7,color:1},{x:5,y:7,color:1},{x:6,y:7,color:1},{x:7,y:7,color:1},{x:8,y:7,color:1},{x:9,y:7,color:1},{x:10,y:7,color:0},{x:11,y:7,color:1},{x:12,y:7,color:1},{x:13,y:7,color:1},{x:14,y:7,color:1},{x:15,y:7,color:0},{x:16,y:7,color:0},
			 {x:0,y:8,color:0},{x:1,y:8,color:0},{x:2,y:8,color:0},{x:3,y:8,color:0},{x:4,y:8,color:0},{x:5,y:8,color:0},{x:6,y:8,color:0},{x:7,y:8,color:0},{x:8,y:8,color:1},{x:9,y:8,color:1},{x:10,y:8,color:1},{x:11,y:8,color:1},{x:12,y:8,color:1},{x:13,y:8,color:0},{x:14,y:8,color:0},{x:15,y:8,color:0},
			 {x:4,y:9,color:0},{x:6,y:9,color:0},{x:7,y:9,color:1},{x:8,y:9,color:0},{x:9,y:9,color:1},{x:10,y:9,color:1},{x:11,y:9,color:1},{x:12,y:9,color:0},{x:13,y:9,color:0},
			 {x:2,y:10,color:0},{x:3,y:10,color:0},{x:5,y:10,color:0},{x:6,y:10,color:0},{x:7,y:10,color:1},{x:8,y:10,color:1},{x:9,y:10,color:1},{x:10,y:10,color:0},{x:11,y:10,color:0},{x:12,y:10,color:0},
			 {x:1,y:11,color:0},{x:5,y:11,color:0},{x:6,y:11,color:1},{x:7,y:11,color:1},{x:8,y:11,color:0},{x:9,y:11,color:0},{x:10,y:11,color:0},
			 {x:4,y:12,color:0},{x:5,y:12,color:1},{x:6,y:12,color:0},{x:7,y:12,color:0},{x:8,y:12,color:0},
			 {x:4,y:13,color:0},{x:5,y:13,color:0},{x:6,y:13,color:0},
			 {x:3,y:14,color:0},{x:4,y:14,color:0}];
		    var opacity = 255;

		    for (s in ships)
		    {
		    	var ship = ships[s];
    	    	for (var j=0;j<ship_model.length;j++) {
			    	var point = ship_model[j];
			    	if ( (point.x+ship.coordinates.x-16)>=0 && (point.x+ship.coordinates.x-16)<game.map.mapL && (point.y+ship.coordinates.y)>=0 && (point.y+ship.coordinates.y)<game.map.mapH ) {
						var i = (point.y+ship.coordinates.y)*self.mapL*4 + (point.x+ship.coordinates.x-16)*4;
						if (i>=0 && i<imgData.data.length) {
							imgData.data[i] = color[point.color][0];
							imgData.data[i+1] = color[point.color][1];
							imgData.data[i+2] = color[point.color][2];
							imgData.data[i+3] = 255*opacity;
						}
					}
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
		if (game.gameOn) {
			if (self.lavaStep) {
				var delay = 5000;
				if (self.lavaStep>=self.mapH/4)
					delay = 10000;
				if (self.lavaStep>=self.mapH/3)
					delay = 10000000000;

				if ( (Date.now()-self.lavaDelay>delay*game.gameSpeed) ) {
					self.releaseLava();
					self.lavaDelay = Date.now();
				}
			}

			if (self.rainStep) {
				var delay = 5000;
				if ( (Date.now()-self.rainDelay>delay*game.gameSpeed) ) {
					self.rain();
					self.rainDelay = Date.now();
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
		var hearth = ["0,45.486 38.514,45.486 44.595,33.324 50.676,45.486 57.771,45.486 62.838,55.622 71.959,9 80.067,63.729 84.122,45.486 97.297,45.486 103.379,40.419 110.473,45.486 150,45.486",
				  	  "0,45.486 19.257,45.486 22.2975,33.324 25.338,45.486 28.8855,45.486 31.419,55.622 35.9795,9 40.0335,63.729 42.061,45.486 48.6485,45.486 51.6895,40.419 55.2365,45.486 75,45.486 94.257,45.486 97.2975,33.324 100.338,45.486 103.8855,45.486 106.419,55.622 110.9795,9 115.0335,63.729 117.061,45.486 123.6485,45.486 126.6895,40.419 130.2365,45.486 150,45.486",
				  	  "0,45.8 150,45.8"];
		var playerAlive = [];
		for (var i=game.hero?-1:0;i<game.opponents.playerNb;i++) {
			var $playerTracker;
			var player;
			if (i==-1)
				player=game.hero;
			else
				player=game.opponents.opponents[i];
			
	    	if (self.$tracker.find("#id_"+player.id).length == 0)
	    		self.$tracker.append("<li id='id_"+player.id+"' data-id='"+player.id+"' class='ui'><div>id:<span>"+player.id+"</span><br/>name:<span>"+player.name+"</span><br/>coord:<span class='coord'></span><br/>attack:<span class='attack'></span><br/>range:<span class='range'></span><br/>food:<div class='percent'><span class='food'></span></div>water:<div class='percent'><span class='water'></span></div>weight:<div class='percent'><span class='weight'></span></div>health:<div class='percent'><span class='health'></span></div>inventory:<span class='inventory'></span><br/>follow:<span><input class='follow' type='checkbox' "+(player.follow?'checked':'')+"></span></div><div class='heart-rate'><svg version='1.0' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='150px' height='73px' viewBox='0 0 150 73' enable-background='new 0 0 150 73' xml:space='preserve'><polyline fill='none' stroke='#009B9E' stroke-width='3' stroke-miterlimit='10' points='"+hearth[0]+"'/></svg><div class='fade-in'></div><div class='fade-out'></div></div></li>");
	    	
	    	$playerTracker = self.$tracker.find("#id_"+player.id);
	    	if (player.health==0) {
	    		player.follow=false;//hide the path of the dead ones
	    		$playerTracker.find("input").prop('disabled',true);
	    		$playerTracker.find("polyline")[0].setAttribute("points",hearth[2]);
	    		$playerTracker.addClass("dead");
	    		$playerTracker.find(".health").text(player.health+"/"+player.healthMax).css("width",player.health*100/player.healthMax);
	    	}
	    	else {
	    		if (player.health<player.healthLimit)
	    			$playerTracker.find("polyline")[0].setAttribute("points",hearth[1]);
	    		else
	    			$playerTracker.find("polyline")[0].setAttribute("points",hearth[0]);
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
	    	for (var o in player.inventory) {
	    		var item = player.inventory[o];
	    		inventory+=item.name
	    		if (item.type=="ammo")
	    			inventory+="("+item.specs.quantity+")";
	    		if (item.quantity && item.quantity > 1)
	    			inventory+="("+item.quantity+")";
    			inventory+=", ";
	    	}
	    	if (inventory.length)
	    		inventory = inventory.substring(0,inventory.length-2);
	    	else
	    		inventory = "/";
	    	$playerTracker.find(".inventory").text(inventory);
	    	$playerTracker.find("input").prop('checked',player.follow);
		}
		if (playerAlive.length==1) {
			self.$board.find("#alive").text("WINNER : "+playerAlive[0].name+ "("+playerAlive[0].id+")");
			displayMessage(playerAlive[0].name+" wins!","#000000","FFD700");
			game.gameOn=false;
		}
		else
			self.$board.find("#alive").text(playerAlive.length+" players alive");
    }

    this.getInfoCase = function(x,y) {
		self.$tracker.find(".active").removeClass('active');
    	for (var i=game.hero?-1:0;i<game.opponents.playerNb;i++) {
			var $playerTracker;
			var player;
			if (i==-1)
				player=game.hero;
			else
				player=game.opponents.opponents[i];
			if (player.coordinates.x==x && player.coordinates.y==y)
	    		self.$tracker.find("#id_"+player.id).addClass('active');
	    }
	    for (var o in game.items.items) {
	    	if (game.items.items[o].coordinates.x == x && game.items.items[o].coordinates.y == y)
	    		displayMessage(game.items.items[o]);
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
				game.hero.follow = $(this).prop("checked");
			else
				game.opponents.opponents[id].follow = $(this).prop("checked");
		});

		game.map.$canvas[0].addEventListener('click', function(event) {
			var elemLeft = this.offsetLeft;
    		var elemTop  = this.offsetTop;
		    var x = parseInt((event.pageX - elemLeft)/5,10);
		    var y = parseInt((event.pageY - elemTop)/5,10);
		    self.getInfoCase(x,y);
		},false);
	}

	this.tick = function() {
		if (game.gameOn) {
			var delay = 1000;
			if (Date.now()-self.last>delay*game.gameSpeed) {
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
		self.sounds["canon"] = new Sound("#canon_sound");
		self.sounds["rain"] = new Sound("#rain_sound");
		self.sounds["ship"] = new Sound("#ship_sound");
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
		self.genericItems.push(new GenericItem(i++,"health",[{property:"health",type:"use",value:50}],1,"small medipack",10));
		self.genericItems.push(new GenericItem(i++,"health",[{property:"health",type:"use",value:100}],1.5,"medipack",8));
		self.genericItems.push(new GenericItem(i++,"health",[{property:"health",type:"use",value:200}],2,"large medipack",5));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:15,range:2,accuracy:1},1,"baseball bat",8));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:20,range:2,accuracy:1},1,"spear",6));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:30,range:2,accuracy:1},1,"sword",5));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:30,range:10,accuracy:0.6,ammo:"arrows"},3,"bow",7));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:40,range:7,accuracy:0.8,ammo:"bullets"},0.5,"gun",4));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:70,range:3,accuracy:0.2,ammo:"shotgun shell"},3,"shotgun",3));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:50,range:20,accuracy:0.8,ammo:"riffle ammo"},4,"longneck riffle",2));
		self.genericItems.push(new GenericItem(i++,"weapon",{attack:80,range:20,accuracy:0.6,ammo:"rocket"},8,"bazooka",1));
		self.genericItems.push(new GenericItem(i++,"ammo",{quantity:20},2,"arrows",14));
		self.genericItems.push(new GenericItem(i++,"ammo",{quantity:24},2.4,"bullets",8));
		self.genericItems.push(new GenericItem(i++,"ammo",{quantity:6},0.6,"shotgun shell",6));
		self.genericItems.push(new GenericItem(i++,"ammo",{quantity:8},0.8,"riffle ammo",4));
		self.genericItems.push(new GenericItem(i++,"ammo",{quantity:2},0.8,"rocket",2));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"healthMax",type:"permanent",value:150}],1,"light armour",20));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"healthMax",type:"permanent",value:200}],1.5,"armour",10));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"healthMax",type:"permanent",value:250}],2,"heavy armour",5));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"vision",type:"permanent",value:3}],1,"binocular",10));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"weightMax",type:"permanent",value:50}],2,"backpack",10));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"waterMax",type:"cumul",value:50}],2,"water skin",7));
		self.genericItems.push(new GenericItem(i++,"object",[{property:"foodMax",type:"cumul",value:50}],2,"plastic tub",7));
	}
	this.generate();
}

var GenericItem = function(id,type,specs,weight,name,frequency) {
	this.id = id;
	this.type = type;
	this.specs = $.extend(true, [], specs);;
	this.weight = weight;
    this.name = name;
    this.frequency = frequency;//%
    var self = this;
}

var Items = function(itemNb) {
	this.itemNb = itemNb;
	this.items = new Array();
	var self = this;

	this.generate = function() {
		var weights = game.genericItems.genericItems.map((item) => (item.frequency));
		
		for (var i=0; i<self.itemNb; i++) {
			var x = getRandom(0,game.map.mapL-1);
			var y = getRandom(0,game.map.mapH-1);
			var item = chance.weighted(game.genericItems.genericItems, weights);
			self.items.push(new Item($.extend(true, [],item),{x:x,y:y},false));
		}
	}

	this.hasItem = function(coordinates) {
		for (var i in self.items) {
			if (self.items[i].coordinates.x == coordinates.x && self.items[i].coordinates.y == coordinates.y && !self.items[i].grabbed) {
				self.items[i].grabbed = true;
				return self.items[i];
			}
		}
		return false;
	}
	this.generate();
}

var Item = function(item,coordinates,grabbed) {
	this.id = item.id;
	this.quantity = 1;
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
    	self.map = $.extend(true, [], game.map.map);
    }

    this.setPosition = function(x,y) {
    	self.coordinates={x:x,y:y};
    }

    this.getItem = function(item) {
    	if (item) {
    		if ( item.type=="ammo" || (item.specs[0] && ( item.specs[0].type=="use" || item.specs[0].type=="cumul") ) || !self.hasItem(item.id) ) {
	    		displayMessage(self.name+" ("+self.id+") get item "+item.name,"#FFD700");
	    		if (item.weight+self.weight<=self.weightMax || item.name=="backpack" && !self.hasItemByName("backpack")) {
		    		if (item.type=="ammo") {
		    			if (self.hasItem(item.id)) {
    						var ammo = $.grep(self.inventory, function(e){ return e.id == item.id; })[0];
    						ammo.specs.quantity+=item.specs.quantity;
    						ammo.weight+=item.weight;
		    				self.updateWeight(item.weight);
		    			}
		    			else {
		    				self.updateWeight(item.weight);
		    				self.inventory.push(item);
		    			}
		    		}
		    		else {
		    			self.updateWeight(item.weight);
		    			if (self.hasItem(item.id)) {
		    				var tempItem = $.grep(self.inventory, function(e){ return e.id == item.id; })[0];
		    				tempItem.quantity += item.quantity;
		    			}
		    			else
		    				self.inventory.push(item);
						if (item.type=="object") {
				    		for (var i in item.specs) {
				    			var spec = item.specs[i];
				    			if (spec.type=="permanent") {
				    				self[spec.property] = Math.max(self[spec.property],spec.value);
				    				self.cleanItems(spec.property, self[spec.property]);
				    			}
				    			if (spec.type=="cumul") {
				    				self[spec.property] += spec.value;
				    			}
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
	    		for (var i in player.inventory) {
	    			var item = player.inventory[i];
		    		self.getItem(item);
					var index = player.getIndexInventory(item.id);
		    		if (index > -1)
					    player.inventory.splice(index, 1);//empty the inventory so no one can steal what is left
	    		}
	    	}
	    }
    }

    this.getIndexInventory = function(id) {
    	for(var i in self.inventory) {
    		if (self.inventory[i].id==id)
    			return i;
		}
		return -1;
    }

    this.hasItem = function(id) {
    	var result = [];
    	if (self.inventory.length)
    		result = $.grep(self.inventory, function(e){ return e.id == id; });
    	return result.length;
    }

    this.hasItemByName = function(name) {
    	var result = [];
    	if (self.inventory.length)
    		result = $.grep(self.inventory, function(e){ return e.name == name; });
    	return result.length;
    }

    this.hasWeapon = function() {
    	var weapons = self.inventory.filter(function(item){
    		return item.type=="weapon";
    	});
    	for (var w in weapons) {
    		var weapon = weapons[w];
    		if (weapon.ammo)
    			return true;
    		else 
    			if (self.getAmmo(weapon).specs.quantity>0)
    				return true;
    	}
    	return false;
    }

    this.getAmmo = function(item) {
    	if (item.specs["ammo"]) {
    		var ammos = self.inventory.filter(function(item){
	    		return item.type=="ammo";
    		});
    		for (var i in ammos) {
	    		if (ammos[i].name==item.specs["ammo"])
    				return ammos[i];
			}
			return {id:-1, specs:{quantity:0}};
		}
		else 
			return {id:-1, specs:{quantity:1}};
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
		if (item.quantity>1)
			item.quantity-=1;
		else {
			var index = self.getIndexInventory(item.id);
    		if (index > -1)
				self.inventory.splice(index, 1);
		}
    }

    this.cleanItems = function(property, value) {
    	var result = [];
    	if (self.inventory.length)
    		result = $.grep(self.inventory, function(e){ return e.type == "object"; });
    	
    	for (var i in result) {
    		var item = result[i];
    		for (var s in item.specs) {
				var spec = item.specs[s];
				if (spec.type=="permanent")
					if (spec.property == property && spec.value<value)
						self.dropItem(item.id);
			}
    	}
    }

    this.dropItem = function(id) {
    	var item = $.grep(self.inventory, function(e){ return e.id == id; })[0];
    	displayMessage(self.name+" ("+self.id+") dropped "+item.name,"#FFD700");
		self.updateWeight(-item.weight);
		if (item.quantity>1)
			item.quantity-=1;
		else
		{
			var index = self.getIndexInventory(item.id);
    		if (index > -1)
				self.inventory.splice(index, 1);
		}
    }

    this.useAmmo = function(id) {
    	if (id!=-1) {
    		var item = $.grep(self.inventory, function(e){ return e.id == id; })[0];
			self.updateWeight(-(item.weight/item.specs.quantity));
    		item.specs.quantity-=1;
    		displayMessage(self.name+" ("+self.id+") used 1 ammo (/"+item.specs.quantity+") "+item.name,"red");

	    	if (item.quantity<=0) {
				var index = self.getIndexInventory(item.id);
    			if (index > -1)
					self.inventory.splice(index, 1);
	    	}
    	}
    }

    this.updateWeight = function(weight) {
    	self.weight=round(self.weight+weight,2);
    }

    this.updatePlayer = function(coef) {
    	if (self.health) {
    		self.food=Math.max(0,round(self.food-round(coef*game.map.map[self.coordinates.x][self.coordinates.y].altitude,2),2));
    		if (game.map.map[self.coordinates.x][self.coordinates.y].type == 1)
	    		self.water=Math.max(0,round(self.water-coef,2));
    		if (game.map.map[self.coordinates.x][self.coordinates.y].type==2)
    			self.health = Math.max(0,self.health-50);
    		self.checkHealth();
    		self.getItem(game.items.hasItem(self.coordinates));
    		self.getInventory(self.hasOpponent(0,self.coordinates));
    	}
    }

    this.hasOpponent = function(status,coordinates) {
    	//status :
    	//0: death
    	//1: alive
    	//2: either
		for (var o=game.hero?-1:0;o<game.opponents.playerNb;o++) {
			var player;
			if (o==-1)
				player=game.hero;
			else
				player=game.opponents.opponents[o];

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
		var range = game.map.map[x][y].altitude*self.vision;

		var closedOpponents = [];

		for (var i=Math.max(0,(x-range));i<=Math.min(game.map.mapL-1,(x+range));i++) {
			for (var j=Math.max(0,(y-range));j<=Math.min(game.map.mapH-1,(y+range));j++) {
				var powX = Math.pow(i-x,2);
				var powY = Math.pow(j-y,2);
				if ( powX + powY < Math.pow(range,2) ) {
					for (var o=game.hero?-1:0;o<game.opponents.playerNb;o++) {
						var player;
						if (o==-1)
							player=game.hero;
						else
							player=game.opponents.opponents[o];
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
		var range = game.map.map[x][y].altitude*self.vision;

		var closedItems = [];

		var itemsAvailable = game.items.items.filter(function(item){
			return item.grabbed==false;
		});
		
		for (var i=Math.max(0,(x-range));i<=Math.min(game.map.mapL-1,(x+range));i++) {
			for (var j=Math.max(0,(y-range));j<=Math.min(game.map.mapH-1,(y+range));j++) {
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
		var range = game.map.map[x][y].altitude*self.vision;

		var closedLava = [];
		
		for (var i=Math.max(0,(x-range));i<=Math.min(game.map.mapL-1,(x+range));i++) {
			for (var j=Math.max(0,(y-range));j<=Math.min(game.map.mapH-1,(y+range));j++) {
				var powX = Math.pow(i-x,2);
				var powY = Math.pow(j-y,2);
				if ( powX + powY < Math.pow(range,2) )
					if (game.map.map[i][j].type==2)
						closedLava.push({coordinates:{x:i,y:j},distance:getDistance({x:i,y:j},self.coordinates)});
			}
		}


		closedLava.sort(function(a, b) {
		    return a.distance - b.distance;
		});

		return closedLava;
    }

    this.getClosedWater = function() {
    	var x = self.coordinates.x;
		var y = self.coordinates.y;
		var range = 1;

		var closedWater = [];
		var minDistance = 9999999;

		while ((x>range || x+range<game.map.mapL-1 || y>range || y+range<game.map.mapH-1) && closedWater.length==0) {
			for (var i=Math.max(0,(x-range));i<=Math.min(game.map.mapL-1,(x+range));i++) {
				for (var j=Math.max(0,(y-range));j<=Math.min(game.map.mapH-1,(y+range));j++) {
					if (game.map.map[i][j].type==0 && self.map[i][j].opacity==1) {
						var distance = getDistance({x:i,y:j},self.coordinates);
						minDistance = Math.min(minDistance,distance);
						closedWater.push({coordinates:{x:i,y:j},distance:distance});
					}
				}
			}
			range++;
		}

		closedWater = closedWater.filter(function(zone) {
		    return zone.distance == minDistance;
		});

		return closedWater;
    }

    this.getClosedFood = function() {
    	var x = self.coordinates.x;
		var y = self.coordinates.y;
		var range = 1;

		var closedFood = [];
		var minDistance = 99999999;

		while ((x>range || x+range<game.map.mapL-1 || y>range || y+range<game.map.mapH-1) && closedFood.length==0) {
			for (var i=Math.max(0,(x-range));i<=Math.min(game.map.mapL-1,(x+range));i++) {
				for (var j=Math.max(0,(y-range));j<=Math.min(game.map.mapH-1,(y+range));j++) {
					if (game.map.map[i][j].type==1 && game.map.map[i][j].food > 0 && self.map[i][j].opacity==1) {
						var distance = getDistance({x:i,y:j},self.coordinates);
						minDistance = Math.min(minDistance,distance);
						closedFood.push({coordinates:{x:i,y:j},distance:distance});
					}
				}
			}
			range++;
		}

		closedFood = closedFood.filter(function(zone) {
		    return zone.distance == minDistance;
		});

		return closedFood;
    }

    this.getClosedUnknownZone = function() {
    	var x = self.coordinates.x;
		var y = self.coordinates.y;
		var range = 1;
		var minDistance = 9999999;
		var closedUnknownZone = [];
		while ((x>range || x+range<game.map.mapL-1 || y>range || y+range<game.map.mapH-1) && closedUnknownZone.length==0) {
			for (var i=Math.max(0,(x-range));i<=Math.min(game.map.mapL-1,(x+range));i++) {
				for (var j=Math.max(0,(y-range));j<=Math.min(game.map.mapH-1,(y+range));j++) {
					if (self.map[i][j].opacity<1) {
						var distance = getDistance({x:i,y:j},self.coordinates);
						minDistance = Math.min(minDistance,distance);
						closedUnknownZone.push({coordinates:{x:i,y:j},distance:distance});
					}
				}
			}
			range++;
		}

		closedUnknownZone = closedUnknownZone.filter(function(zone) {
		    return zone.distance == minDistance;
		});

		return closedUnknownZone;
    }

    this.getAverageCoord = function(arr,item) {
    	var x=0;
    	var y=0;
    	var len=arr.length;
    	for (var i in arr) {
    		var cur = arr[i];
    		if (item) {
				x+=cur[item].coordinates.x;
    			y+=cur[item].coordinates.y;
    		}
    		else {
    			x+=cur.coordinates.x;
    			y+=cur.coordinates.y;
    		}
    	}
    	return {x:x/len,y:y/len};
    }

    this.checkSurroundings = function() {

		var closedOpponents = self.getClosedOpponents(1);

		if (closedOpponents.length) {			
			var attack = self.attack;
	    	var range = self.range/100;
	    	var damage = round(self.attack*self.accuracy*self.range/100/Math.max(1,closedOpponents[0].distance),2);
	    	var bestWeapon = {name:"fist"};
	    	var bestWeaponAmmo = {id:-1, specs:{quantity:1}};

	    	var weapons = self.inventory.filter(function(item){
	    		return item.type=="weapon";
	    	});
	    	for (var w in weapons) {
	    		var weapon = weapons[w];
	    		var ammo = self.getAmmo(weapon);

    			if (weapon.specs.range >= closedOpponents[0].distance && ammo.specs.quantity>0) {
	    			var tempAttack = weapon.specs.attack;
	    			var tempRange = weapon.specs.range;
	    			var tempAccuracy = weapon.specs.accuracy;
	    			var tempDamage = 0;

	    			tempDamage = tempAttack*tempAccuracy*(tempRange/Math.max(1,closedOpponents[0].distance));

	    			if (tempDamage>damage) {
	    				damage = round(tempDamage,2);
	    				bestWeapon = weapon;
	    				bestWeaponAmmo = ammo;
	    			}
    			}
			}
			displayMessage(self.name+" ("+self.id+") used "+bestWeapon.name+" on "+closedOpponents[0].player.name+" ("+closedOpponents[0].player.id+") and caused "+damage+" on "+closedOpponents[0].player.health,"#B22222");
			closedOpponents[0].player.health = Math.max(0,round( round(closedOpponents[0].player.health,2) - damage,2));
			self.useAmmo(bestWeaponAmmo.id);
			if (closedOpponents[0].player.health==0) {
    			game.sounds.sounds["canon"].play();
				displayMessage(self.name+" ("+self.id+") killed "+closedOpponents[0].player.name+" ("+closedOpponents[0].player.id+")","#B22222","#000000");
			}

		}
    }

    this.eat = function() {
    	var foodAvailable = game.map.map[self.coordinates.x][self.coordinates.y].food;
    	var foodTaken = round(foodAvailable*self.gathering/100,2);
    	game.map.map[self.coordinates.x][self.coordinates.y].food=Math.max(0,foodAvailable-foodTaken);
    	self.food=Math.min(self.foodMax,self.food+foodTaken);
    }

    this.drink = function() {
    	self.water=self.waterMax;
    }


    this.checkHealth = function() {
    	if (self.hasItemByName("small medipack") && (self.health<self.healthMax-50  || self.health < self.healthLimit) )
    		self.useItem(0);
    	if (self.hasItemByName("medipack") && (self.health<self.healthMax-100 || self.health < self.healthLimit) )
    		self.useItem(1);
    	if (self.hasItemByName("large medipack") && (self.health<self.healthMax-200 || self.health < self.healthLimit) )
    		self.useItem(2);
    	if (self.food<5)
    		self.health = Math.max(0,round(self.health-0.1,2));
    	if (self.food == 0)
    		self.health = Math.max(0,round(self.health-0.5,2));
    	if (self.water==0)
    		self.health = Math.max(0,round(self.health-0.1,2));
    	if (self.health==0)
    	{
    		game.sounds.sounds["canon"].play();
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
	self.init(99,name,coordinates,2,10,0.3,100,100,20,100,20,20,100,25,100,true);

	this.bind = function() {
		$(document).on("keyup",function(evt) {
			if (game.map) {
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
		if (game.gameOn) {
			if (Date.now()-self.last>self.delay*game.gameSpeed && self.health) {
				self.last = Date.now();
				if (self.keydown != -1 && game.map && game.map.initialized && self.health)
					self.move(self.keydown-37);
				else
				{
					if (game.map.map[self.coordinates.x][self.coordinates.y].type==0)
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
			self.coordinates.y=game.map.mapH-1;
			reset = true;
		}
		if (self.coordinates.y>game.map.mapH-1) {
			self.coordinates.y=0;
			reset = true;
		}
		if (self.coordinates.x<0) {
			self.coordinates.x=game.map.mapL-1;
			reset = true;
		}
		if (self.coordinates.x>game.map.mapL-1) {
			self.coordinates.x=0;
			reset = true;
		}

		self.updatePlayer(0.2);

		if (reset)
			game.map.create();
		if (game.map.fogMode)
			game.map.lightSurroundingPlayer(-1);
		game.map.countDiscovery();
	}

	this.bind();
}

var Ships = function() {
	this.delayShip = 40;
	this.lastShipMove = Date.now();
	this.ticker;
	this.ships = [];
	this.needTick = false;
	var self = this;

	this.startTicking = function() {
		if (self.ticker)
			cancelAnimationFrame(self.tick);
		self.tick();
	}

	this.tick = function() {
		if (game.gameOn && self.needTick) {
			if (Date.now()-self.lastShipMove>self.delayShip*game.gameSpeed) {
				self.lastShipMove = Date.now();
		    	var ships = self.ships.filter(function(ship){
					return ship.on==true;
				});
				if (ships.length==0) {
					self.needTick=false;
    				game.sounds.sounds["ship"].stop();
				}
				else {
					for (var i in ships) {
						ships[i].move();
					}
				}
			}
			self.ticker = requestAnimationFrame(self.tick);
		}
	}

	this.addShip = function() {
		self.ships.push(new Ship({x:0,y:50}, {x:game.map.mapL-1,y:50}));
		self.needTick = true;
    	game.sounds.sounds["ship"].play();
		self.startTicking();
	}
}

var Ship = function(coordinates,destination) {
	this.coordinates={x:coordinates.x,y:coordinates.y};
	this.destination={x:destination.x,y:destination.y};
	this.direction=game.map.getDirection(coordinates,destination);
	this.on=true;
	var self = this;

	this.move = function() {
		switch(self.direction) {
			case 0 : self.coordinates.x=self.coordinates.x-1; self.coordinates.y=self.coordinates.y-1; break;
			case 1 : self.coordinates.y=self.coordinates.y-1; break;
			case 2 : self.coordinates.x=self.coordinates.x+1; self.coordinates.y=self.coordinates.y-1; break;
			case 3 : self.coordinates.x=self.coordinates.x-1; break;
			case 4 : self.coordinates.x=self.coordinates.x+1; break;
			case 5 : self.coordinates.x=self.coordinates.x-1; self.coordinates.y=self.coordinates.y+1; break;
			case 6 : self.coordinates.y=self.coordinates.y+1; break;
			case 7 : self.coordinates.x=self.coordinates.x+1; self.coordinates.y=self.coordinates.y+1; break;
		}
		if (self.coordinates.x==self.destination.x+16 && self.coordinates.y == self.destination.y)
			self.on=false;
	}
}

var Opponents = function(playerNb) {
	this.playerNb = playerNb;
	this.delayOpponent = 500;
	this.lastOpponentMove = Date.now();
	this.opponents = [];
	this.ticker;
	var self = this;

	this.generate = function() {
		var names = chance.unique(chance.first, self.playerNb);
		for (var i=0; i<self.playerNb; i++) {
			var x = getRandom(0,game.map.mapL-1);
			var y = getRandom(0,game.map.mapH-1);
			self.opponents[i] = new Opponent(i,names[i],{x:x,y:y});
		}
	}

	this.startTicking = function() {
		if (self.ticker)
			cancelAnimationFrame(self.tick);
		self.tick();
	}

	this.tick = function() {
		if (game.gameOn) {
			if (Date.now()-self.lastOpponentMove>self.delayOpponent*game.gameSpeed) {
				self.lastOpponentMove = Date.now();
				for (var i=0; i<self.playerNb; i++) {
					if (self.opponents[i].health) {
						if (self.opponents[i].food < self.opponents[i].foodLimit && game.map.map[self.opponents[i].coordinates.x][self.opponents[i].coordinates.y].food > 0) {
							self.opponents[i].eat();
							self.opponents[i].updatePlayer(0.1);
						}
						else {
							if (self.opponents[i].water < self.opponents[i].waterLimit && game.map.map[self.opponents[i].coordinates.x][self.opponents[i].coordinates.y].type == 0) {
								self.opponents[i].drink();
								self.opponents[i].updatePlayer(0.1);
							}
							else {
								self.opponents[i].move();
								if (game.map.fogOpponentsMode)
									game.map.lightSurroundingPlayer(i);
							}
						}
						self.opponents[i].checkSurroundings();
					}
				}
			}
			self.ticker = requestAnimationFrame(self.tick);
		}
	}

	self.generate();
}

var Opponent = function (id,name,coordinates) {
	Player.call(this);

	var self = this;
	self.init(id,name,coordinates,1,10,0.3,100,100,20,100,20,20,100,25,100,true);

    this.move = function() {
    	var randomDirection = true;
    	var direction = getRandom(0,8);
    	if (game.map.lavaStep> 0 ) {
    		var closedLava = self.getClosedLava();
    		if (closedLava.length) {
				direction = game.map.getReverseDirection(game.map.getDirection(self.coordinates,self.getAverageCoord(closedLava)));//peut être pas average (médiane ?)
    			randomDirection = false;
				//console.log("lava go to "+direction);
    		}
    	}
    	if (randomDirection) {
	    	var closedOpponents = self.getClosedOpponents(2);
	    	if (closedOpponents.length) {
	    		if (closedOpponents[0].player.health) {
					direction = game.map.getDirection(self.coordinates,self.getAverageCoord(closedOpponents,"player"));
    				randomDirection = false;
					//console.log("opponents go to "+direction);
	    			if (self.health<=self.healthLimit || (!self.hasWeapon() && getRandom(0,3)<=2) ) {//run away if no health (100%) or no weapon (66%)
	    				direction = game.map.getReverseDirection(direction);
    					//console.log("opponents run away go to "+direction+" "+self.health+" "+self.healthLimit);
	    			}
	    		}
	    		else {
	    			if (closedOpponents[0].player.inventory.length) {
						direction = game.map.getDirection(self.coordinates,closedOpponents[0].player.coordinates);
	    				randomDirection = false;
    					//console.log("corpse go to "+direction);
	    			}
	    		}
	    	}
	    }
	    if (randomDirection) {
    		if (self.water < self.waterLimit) {
    			var closedWater = self.getClosedWater();
    			if (closedWater.length) {
					direction = game.map.getDirection(self.coordinates,closedWater[getRandom(0,closedWater.length-1)].coordinates);
    				randomDirection = false;
    				//console.log("water go to "+direction);
    			}
    		}
    	}
    	if (randomDirection) {
    		if (self.food < self.foodLimit) {
    			var closedFood = self.getClosedFood();
    			if (closedFood.length) {
					direction = game.map.getDirection(self.coordinates,closedFood[getRandom(0,closedFood.length-1)].coordinates);
    				randomDirection = false;
    				//console.log("food go to "+direction);
    			}
    		}
    	}
		if (randomDirection) {
			var closedItems = self.getClosedItems();//warning : if the player is fully loaded he will probably stay static
			if (closedItems.length) {
				direction = game.map.getDirection(self.coordinates,closedItems[0].item.coordinates);
				randomDirection = false;
    			//console.log("item go to "+direction);
			}
	    }

	    if (randomDirection) {
	    	var closedUnknownZone = self.getClosedUnknownZone();
			if (closedUnknownZone.length) {
				direction = game.map.getDirection(self.coordinates,closedUnknownZone[getRandom(0,closedUnknownZone.length-1)].coordinates);
				randomDirection = false;
    			//console.log("unknown go to "+direction);
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

		x = Math.min(game.map.mapH-1,Math.max(0,x));
		y = Math.min(game.map.mapH-1,Math.max(0,y));
		self.coordinates.x = x;
		self.coordinates.y = y;
		self.updatePlayer(0.2);
    }
}

function drawStats() {
	var opp1 = game.opponents.opponents[0];
	var opp2 = game.opponents.opponents[1];
	Highcharts.chart('container', {

        chart: {
            polar: true,
            type: 'line'
        },

        exporting: {
		    buttons: {
		        contextButton: {
		            enabled: false
		        }    
		    }
		},

		credits: {
			enabled: false
		},

        title: {
            text: 'Team Specs',
            x: -80
        },

        pane: {
            size: '80%'
        },
        xAxis: {
            categories: ['Vision', 'Attack', 'Range', 'Food', 'Water', 'Weight', 'Health', 'Gathering'],
            tickmarkPlacement: 'on',
            lineWidth: 0
        },

        yAxis: {
            gridLineInterpolation: 'polygon',
            lineWidth: 0,
            min: 0
        },

        tooltip: {
            shared: true,
            pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y:,.0f}</b><br/>'
        },

        legend: {
            align: 'right',
            verticalAlign: 'top',
            y: 70,
            layout: 'vertical'
        },

        series: [{
            name: opp1.name,
            data: [opp1.vision*100, opp1.attack, opp1.range, opp1.foodMax, opp1.waterMax, opp1.weightMax, opp1.health, opp1.gathering],
            pointPlacement: 'on'
        }, {
            name: opp2.name,
            data: [opp2.vision*100, opp2.attack, opp2.range, opp2.foodMax, opp2.waterMax, opp2.weightMax, opp2.health, opp2.gathering],
            pointPlacement: 'on'
        }]

    });
}



var Game = function() {
	this.genericItems;
	this.items;
	this.opponents = [];
	this.hero;
	this.name;
	this.map;
	this.ships;
	this.gameSpeed = 1;
	this.gameOn;
	this.debugMode = false;
	this.sounds;
	this.ui;
	var self = this;

	this.welcome = function() {
		//game.start();

		modal(false,"Welcome!","<p>Before your recruits arrived can you recall me your name?</p><form><input name='name' placeholder='Type here...' value='Haymitch'></form>","","And rememeber it this time!",null,game.saveName);
	}

	this.saveName = function() {
		self.name = $("#modal").find("input[name]").val();

		modal(false,"Look! Your champions are coming!","<p>They are <b>"+game.opponents.opponents[0].name+"</b> and <b>"+game.opponents.opponents[1].name+"</b>! Actually, they don't look that bad! They may survive the first minute...</p><p>"+self.name+" check their stats if you train them well they will be even better and who know they may be able to win!</p><div id='container' style='min-width: 400px; max-width: 600px; height: 400px; margin: 0 auto'></div>","","Let's train them then!",null,game.train);
		drawStats();
	}

//data: [opp1.vision*100, opp1.attack, opp1.range, opp1.foodMax, opp1.waterMax, opp1.weightMax, opp1.health, opp1.gathering],
	this.train = function() {
		var opp = game.opponents.opponents[0];
		var availablePoints = 100;
		var skills = "<div class='row'><form class='form-horizontal'>"+
					 getForm("health",opp.health,10,200,5)+
					 getForm("attack",opp.attack,10,200,5)+
					 getForm("vision",opp.vision*100,10,200,5)+
					 getForm("range",opp.range,10,200,5)+
					 getForm("foodMax",opp.foodMax,10,200,5)+
					 getForm("waterMax",opp.waterMax,10,200,5)+
					 getForm("weightMax",opp.weightMax,10,200,5)+
					 getForm("gathering",opp.gathering,10,200,5)+
					 "</form>"+
					 "<p>Available points:<span id='availablePoints'>100</span></p>"+
					 "</div>";
		modal(false,"Let's do this! Your champions have few points to allocate in their specs!","<p>Use the + to add points to a skill and a minus if you changed your mind.</p><p>Is that clear "+self.name+"?</p>"+skills,"","Let's start with "+game.opponents.opponents[0].name+"!",null,game.trainSkill0);
		
		$('.btn-minuse').off().on('click', function(){
			availablePoints
			var step = parseInt($(this).parent().siblings('input').attr("step"),10);
			var origin = parseInt($(this).parent().siblings('input').attr("origin"),10);
			var val = parseInt($(this).parent().siblings('input').val(),10);
			if (val-step>=origin) {
				$(this).parent().siblings('input').val(val - step );
				availablePoints+=step;
				$("#availablePoints").text(availablePoints);
			}
		});

		$('.btn-pluss').off().on('click', function(){
			var step = parseInt($(this).parent().siblings('input').attr("step"),10);
			if (availablePoints-step>=0) {
				$(this).parent().siblings('input').val(parseInt($(this).parent().siblings('input').val(),10) + step );
				availablePoints-=step;
				$("#availablePoints").text(availablePoints);
			}
		});		    
	}

	this.trainSkill0 = function() {
		closeModal();
		game.start();
		//modal(false,"Let's do this! Your champions have few points to allocate in their specs!","<p>Use the + to add points to a skill and a minus if you changed your mind.</p><p>Is that clear "+self.name+"?</p>","","Let's start with "+game.opponents.opponents[0].name+"!",null,game.trainSkill0);
	}

	this.start = function() {
		self.gameSpeed = 1;
		$("#pause").removeClass("hide");
		$("#play").addClass("hide");
		$("#speed").text(self.gameSpeed);
		/*	
			Hero.prototype = Object.create(Player.prototype); 
			Hero.prototype.constructor = Player;

			var name = $("input[name=name]").val();
			self.hero = new Hero(name,{x:0,y:0});
			self.hero.move();
		*/
		self.opponents.startTicking();

		if (self.map.ticker)
			cancelAnimationFrame(self.map.tick);
		self.map.tick();

		self.sounds = new Sounds();
		self.ui = new Ui();

		self.map.$map.removeClass("hide");
		$("#board").removeClass("hide");
		$("#messages").removeClass("hide");
		$("#legend").removeClass("hide");
		$("#discovery").removeClass("hide");
		$("#speedControl").removeClass("hide");
	}

	this.bind = function() {
		$("#lava").on("click",function(){
			self.map.releaseLava();
		});

		$("#rain").on("click",function(){
			self.map.rain();
		});

		$("#ship").on("click",function(){
			self.ships.addShip();
		});


		$("#slower").on("click",function(){
			self.gameSpeed+=0.1;
			$("#speed").text("x"+round( (2-self.gameSpeed),2));
		});

		$("#pause").on("click",function(){
			self.gameSpeed=99999999999999999;
			$(this).addClass("hide");
			$("#play").removeClass("hide");
			$("#speed").text(0);
		});

		$("#play").on("click",function(){
			self.gameSpeed=1;
			$(this).addClass("hide");
			$("#pause").removeClass("hide");
			$("#speed").text(self.gameSpeed);
		});

		$("#faster").on("click",function(){
			self.gameSpeed-=0.1;
			$("#speed").text("x"+round( (2-self.gameSpeed),2));
		});

		$("#mapSettings").on("submit",function(evt){
			var mapH = parseInt($("input[name=mapHeight]").val(),10);
			var mapL = parseInt($("input[name=mapWidth]").val(),10);

			var heightMin = parseInt($("input[name=heightMin]").val(),10);
			var heightMax = parseInt($("input[name=heightMax]").val(),10);

			if (heightMin > heightMax) {
				$("input[name=heightMin]").val(heightMax);
				$("input[name=heightMax]").val(heightMin);
				heightMin = parseInt($("input[name=heightMin]").val(),10);
				heightMax = parseInt($("input[name=heightMax]").val(),10);
			}

			var summitNb = parseInt($("input[name=summitNb]").val(),10);
			var lakeNb = parseInt($("input[name=lakeNb]").val(),10);
			var riverNb = parseInt($("input[name=riverNb]").val(),10);

			var playerNb = parseInt($("input[name=playerNb]").val(),10);

			var itemNb = parseInt($("input[name=itemNb]").val(),10);


			var fogMode = $("input[name=fogMode]").prop("checked");
			var fogOpponentsMode = $("input[name=fogOpponentsMode]").prop("checked");
			self.debugMode = $("input[name=debugMode]").prop("checked");

			self.gameOn = true;

			self.map = new Map(mapL,mapH,heightMin,heightMax,summitNb,lakeNb,riverNb,fogMode,fogOpponentsMode);
			self.map.create();

			self.genericItems = new GenericItems();
			self.items = new Items(itemNb);

			Opponent.prototype = Object.create(Player.prototype); 
			Opponent.prototype.constructor = Player;

			self.opponents = new Opponents(playerNb);

			self.ships = new Ships();

			self.gameSpeed = 99999999;
			self.welcome();

			return false;
		});
	}

	self.bind();
}


$(document).ready(function() {
	game = new Game();
});