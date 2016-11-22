var mapL = 100;
var mapH = 100;
var map = new Array();
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

function createMap(heightMin, heightMax, summitNb, lakeNb, riverNb) {
	clearMessage();
	displayMessage("Map generation");
	generateMap(heightMin,Math.floor((heightMin+heightMax)/2));
	displayMessage("Creation of the summits");
	generateSummits(summitNb,heightMax);
	displayMessage("Creation of the moutains");
	generateMountains(heightMin,heightMax);
	displayMessage("Creation of the sources");
	generateLakesSource(lakeNb,heightMin,heightMax);
	displayMessage("Creation of the lakes");
	generateLakes(heightMin,heightMax);
	displayMessage("Creation of the rivers");
	generateRivers(riverNb,heightMin);
}

function generateMap(heightMin, heightMax) {
	for (var i=0;i<mapH;i++) {
		map[i] = new Array();
		for (var j=0;j<mapL;j++) {
			map[i][j]={type:1,altitude:getRandomNormal(heightMin,heightMax)};
		}
	}
}

function generateSummits(summitNb,heightMax) {
	for (var i=0;i<summitNb;i++) {
		var x = getRandom(0,mapH-1);
		var y = getRandom(0,mapL-1);
		map[x][y].altitude=heightMax;
		changeSurroundings(x,y,heightMax);
	}
}

function generateMountains(heightMin,heightMax) {
	for (var i=heightMax; i>heightMin+1; i--) {
		generateRelief(i);
	}
}

function generateRelief(val) {
	displayMessage("Generate level "+val);
	for (var i=0;i<mapH;i++) {
		for (var j=0;j<mapL;j++) {
			if (map[i][j].altitude==val) {
				changeSurroundings(i,j,val-1);
			}
		}
	}
}

function changeSurroundings(y,x,val) {
	var mountainSizeXMin=getRandomNormal(0,5);
	var mountainSizeXMax=getRandomNormal(0,5);
	var mountainSizeYMin=getRandomNormal(0,5);
	var mountainSizeYMax=getRandomNormal(0,5);

	for (var j=(x-mountainSizeXMin);j<=(x+mountainSizeXMax);j++) {
		for (var i=(y-mountainSizeYMin);i<=(y+mountainSizeYMax);i++) {
			if (i>=0 && i<mapH) {
				if (j>=0 && j<mapL) {
					if (x!=j || y!=i) {
						if (map[i][j].altitude<val) {
							map[i][j].altitude=getRandomNormal(val+1,val-1);
						}
					}
				}
			}
		}
	}
}

function generateLakesSource(lakeNb,heightMin,heightMax) {
	for (var i=0;i<lakeNb;i++) {
		var x = getRandom(0,mapH-1);
		var y = getRandom(0,mapL-1);
		if (map[x][y].altitude>=heightMax-1)
			i--;
		else
			map[x][y].type=0;
	}
}

function generateLakes(heightMin,heightMax) {
	for (var i=heightMax; i>heightMin+1; i--) {
		generateLake(i);
	}
}

function generateLake(val) {
	displayMessage("Generate River level "+val);
	for (var i=0;i<mapH;i++) {
		for (var j=0;j<mapL;j++) {
			if (map[i][j].type==0 && map[i][j].altitude==val) {
				changeSurroundingsLake(i,j,val);
			}
		}
	}
}

function changeSurroundingsLake(y,x,val) {
	var riverSizeXMin=getRandomNormal(0,4);
	var riverSizeXMax=getRandomNormal(0,3);
	var riverSizeYMin=getRandomNormal(0,4);
	var riverSizeYMax=getRandomNormal(0,3);
	for (var j=(x-riverSizeXMin);j<=(x+riverSizeXMax);j++) {
		for (var i=(y-riverSizeYMin);i<=(y+riverSizeYMax);i++) {
			if (i>=0 && i<mapH) {
				if (j>=0 && j<mapL) {
					if (x!=j || y!=i) {
						if (map[i][j].altitude<=val) {
							map[i][j].type=0;
						}
					}
				}
			}
		}
	}
}

function generateRivers(riverNb,heightMin) {
	for (var i=0;i<riverNb;i++) {
		var side = getRandom(0,1);
		var orientation;
		if (side) {
			if (getRandom(0,1)) {
				var x = 0;
				orientation=0;
			}
			else {
				var x = mapH-1;
				orientation=2;
			}

			var y = getRandom(0,mapL-1);
		}
		else {
			if (getRandom(0,1)) {
				var y = 0;
				orientation=3;
			}
			else {
				var y = mapL-1;	
				orientation=1;			
			}
			var x = getRandom(0,mapH-1);
		}

		map[x][y].type=0;
		drawRiver(x,y,orientation);
	}
}

/*
0 1 2
3 x 4
5 6 7
*/
function drawRiver(x,y,orientation) {
	var curHeight = map[x][y].altitude;
	var inside=true;
	var i=prevI=x;
	var j=prevJ=y;
	var length = 0;
	var direction = 0;
	var safety=0;
	while (inside) {
		if (length>(mapH*mapL)/4)
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


		i = Math.min(mapH-1,Math.max(0,i));
		j = Math.min(mapH-1,Math.max(0,j));
		

		if ( ( /*map[i][j]<0 ||*/ i==0 || i==mapH-1 || j==0 || j==mapL-1 ) && length > 5 )
			inside=false;
		
		if( map[i][j].type != 0 ) {
			length++;
			if (map[i][j].altitude<=curHeight) {
				safety=0;
				curHeight = map[i][j].altitude;
				map[i][j].type = 0;
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

function loadMap() {
	var str = "";
	for (var i=0;i<mapH;i++) {
		str+="<div class='line'>";
		for (var j=0;j<mapL;j++) {
			str+="<span class='case height"+map[i][j].altitude+(map[i][j].type==0?' blue':'')+"'></span>";
		}
		str+="</div>";
	}
	$("#map").html(str);
}


$(document).ready(function() {
	$("#mapSettings").on("submit",function(evt){
		mapH = parseInt($("input[name=mapHeight]").val(),10);
		mapL = parseInt($("input[name=mapWidth]").val(),10);

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

		debugMode = $("input[name=debugMode]").prop("checked");

		createMap(heightMin, heightMax, summitNb, lakeNb, riverNb);
		loadMap();
		return false;
	});
});