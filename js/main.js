var mapL = 100;
var mapH = 100;
var map = new Array();


function getRandom(min, max){
  	return Math.floor(Math.random() * (max - min +1)) + min;
}

function getRandomNormal(min, max){
	return Math.min(max,Math.max(min,Math.floor(chance.normal({mean: ((min+max)/2), dev: ((min+max)/4)}))));
}

function createMap(heightMin, heightMax, summitNb, sourceNb){
	console.log("Map generation");
	generateMap(heightMin,Math.floor((heightMin+heightMax)/2));
	console.log("Creation of the summits");
	generateSummits(summitNb,heightMax);
	console.log("Creation of the moutains");
	generateMountains(heightMin,heightMax);
	console.log("Creation of the sources");
	generateSources(sourceNb,heightMin);
	console.log("Creation of the rivers");
	generateRivers(heightMin,heightMax);
	generateRivers(heightMin,heightMax);//second pass
}

function generateMap(heightMin, heightMax){
	for (var i=0;i<mapH;i++){
		map[i] = new Array();
		for (var j=0;j<mapL;j++){
			map[i][j]=getRandomNormal(heightMin,heightMax);
		}
	}
}

function generateSummits(summitNb,heightMax){
	for (var i=0;i<summitNb;i++){
		var x = getRandom(0,mapL-1);
		var y = getRandom(0,mapH-1);
		map[x][y]=heightMax;
		changeSurroundings(x,y,heightMax);
	}
}

function generateMountains(heightMin,heightMax){
	for (var i=heightMax; i>heightMin+1; i--){
		generateRelief(i);
	}
}

function generateRelief(val){
	console.log("Generate level "+val);
	for (var i=0;i<mapH;i++){
		for (var j=0;j<mapL;j++){
			if (map[i][j]==val){
				changeSurroundings(i,j,val-1);
			}
		}
	}
}

function changeSurroundings(y,x,val){
	var mountainSizeXMin=getRandomNormal(0,5);
	var mountainSizeXMax=getRandomNormal(0,5);
	var mountainSizeYMin=getRandomNormal(0,5);
	var mountainSizeYMax=getRandomNormal(0,5);

	for (var j=(x-mountainSizeXMin);j<=(x+mountainSizeXMax);j++){
		for (var i=(y-mountainSizeYMin);i<=(y+mountainSizeYMax);i++){
			if (i>=0 && i<mapH){
				if (j>=0 && j<mapL){
					if (x!=j || y!=i){
						if (map[i][j]<val){
							map[i][j]=getRandomNormal(val+1,val-1);
						}
					}
				}
			}
		}
	}
}

function generateSources(sourceNb,heightMin){
	for (var i=0;i<sourceNb;i++) {
		var x = getRandom(0,mapL-1);
		var y = getRandom(0,mapH-1);
		map[x][y]=-map[x][y];
	}
}

function generateRivers(heightMin,heightMax){
	for (var i=-heightMax; i<-(heightMin+1); i++){
		generateRiver(i);
	}
}

function generateRiver(val){
	console.log("Generate River level "+val);
	for (var i=0;i<mapH;i++){
		for (var j=0;j<mapL;j++){
			if (map[i][j]==val){
				changeSurroundingsRiver(i,j,Math.abs(val-1));
			}
		}
	}
}


function changeSurroundingsRiver(y,x,val){
	var riverSizeXMin=getRandomNormal(0,3);
	var riverSizeXMax=getRandomNormal(0,3);
	var riverSizeYMin=getRandomNormal(0,3);
	var riverSizeYMax=getRandomNormal(0,3);

	for (var j=(x-riverSizeXMin);j<=(x+riverSizeXMax);j++){
		for (var i=(y-riverSizeYMin);i<=(y+riverSizeYMax);i++){
			if (i>=0 && i<mapH){
				if (j>=0 && j<mapL){
					if (x!=j || y!=i){
						if (map[i][j]<val && map[i][j]>=0) {
							map[i][j]=-map[i][j];
						}
					}
				}
			}
		}
	}
}


function loadMap(){
	var str = "";
	for (var i=0;i<mapH;i++){
		str+="<div class='line'>";
		for (var j=0;j<mapL;j++){
			str+="<span class='case height"+Math.abs(map[i][j])+(map[i][j]<0?' blue':'')+"'></span>";
		}
		str+="</div>";
	}
	$("#map").html(str);
}


$(document).ready(function(){
	$("#mapSettings").on("submit",function(evt){
		var heightMin = parseInt($("input[name=heightMin]").val(),10);
		var heightMax = parseInt($("input[name=heightMax]").val(),10);

		if (heightMin > heightMax) {
			$("input[name=heightMin]").val(heightMax);
			$("input[name=heightMax]").val(heightMin);
			heightMin = parseInt($("input[name=heightMin]").val(),10);
			heightMax = parseInt($("input[name=heightMax]").val(),10);
		}

		var summitNb = parseInt($("input[name=summitNb]").val(),10);
		var sourceNb = parseInt($("input[name=sourceNb]").val(),10);

		createMap(heightMin, heightMax, summitNb, sourceNb);
		loadMap();
		return false;
	});
});
