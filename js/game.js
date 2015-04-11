/*
 * TODO:
 *
 */

var stageWidth = 900;
var stageHeight = 700;
var canvasName = "game-canvas";

var stage = "";//new createjs.Stage(canvasName);

var CRAD = 0.95;	// Collision radius, default: 0.95
// dot constants
var DOT_RAD = 12;
var DOT_MAXSPEED = 0.15;	// default: 0.15
var DOT_ACC = 0.005;
var DOT_DEC = 0.001;
var DOT_DEFAULT_HP = 100;	// default: 100
// entity constants
var NPC_RAD = 10;
var NPC_MAXSPEED = 0.1;
var SHOT_SPEED = 0.35;	// default: 0.35

var NPC_COUNT = 20;	// default: 20

var touch = false;
var mobile = false;
// keypressed variables
var Wdown, Adown, Sdown, Ddown, mouseDown = false;

var Game = {
	saveTo: "TheDotSave",
	version: 0.044,
	stage: "",

	init: function () {

		//var testStage = new cjs.stage("test-canvas");
		//var testObject = new cjs.graphics.drawRect(0,0,100,100);
		//testStage.add(testObject);

		// detect mobile browser
		// """ some code to detect mobile web browser goes here """
		if (mobile === true) {
			touch = true;
		}
		// Variables...
		Game.user = "";
		Game.gameLoaded = false;
		Game.fps = 60;
		Game.targetDelay = 1000 / Game.fps;
		Game.play = false;
		Game.pause = false;
		Game.multiplayer = false;
		Game.XPpool = 0;
		document.onkeydown = handleKeyDown;
		document.onkeyup = handleKeyUp;
		Game.start();
	},

	start: function () {
		Game.dot = new this.Dot();
		Game.stats = new this.Statistics();
		Game.ach = new this.Achievements();
		Game.user = "";
		Game.restarts = 0;
		Game.lvl = 1;
		Game.money = 0;
		Game.totalScore = 0;
		Game.score = 0;
		Game.lvlTime = 0;
		Game.combo = 1;
		Game.gameLoaded = false;
		Game.loadGame();
		Game.UI.init();
		//Game.ach.updateProgress('doublekill', 2);
		//Game.ach.updateProgress('tripplekill', 3);
	},

	initLvl: function () {
		Game.greensContainer = new createjs.Container();
		Game.redsContainer = new createjs.Container();
		Game.redsShotContainer = new createjs.Container();
		Game.redsContainer.addChild(Game.redsShotContainer);
		Game.redsShots = [];
		Game.greens = [NPC_COUNT/2];
		Game.reds = [NPC_COUNT];
		Game.dot.newLvl();

		Game.timeDiff = 0;
		Game.delay = 0;
		Game.lastTime = performance.now();

		Game.combo = 1;
		Game.lvlTime = 0;

		Game.UI.show_game();
		Game.startLvl();
		Game.play = true;
		Game.pause = false;
		setTimeout(tick, 1000 / Game.fps);
		setTimeout(this.UI.updateText, this.UI.textUpdateDelay);
	},

	nextLvl: function() {
		Game.initLvl();
	},

	startLvl: function() {
		for (var i = 0; i < NPC_COUNT; i++) {
			if (i < NPC_COUNT/2) {
				Game.greens[i] = new GreenDot();
				Game.greensContainer.addChild(Game.greens[i].shape);
			}
			if (Game.lvl % 10 != 0) {
				Game.reds[i] = new RedDot(Game.lvl);
				Game.redsContainer.addChild(Game.reds[i].shape);
			}
		}
		if (Game.lvl % 10 == 0) {
			Game.reds[0] = new RedDot(Game.lvl);
			Game.redsContainer.addChild(Game.reds[0].shape);
		}
	},

	startMultiplayerSession: function() {
		/*Game.multiplayer = true;
		Game.dot = new this.Dot();
		$("body").on("mousedown mousemove", handleMouseDown);
		Game.stage = new createjs.Stage(canvasName);
		Game.stage.addChild(Game.dot.shape);
		Game.stage.addChild(Game.dot.shotContainer);
		setTimeout(tick, 1000 / Game.fps);
		Game.play = true;
		Game.pause = false;
		Game.MP.connection.connect();*/
	},

	lvlComplete: function() {
		this.ach.updateProgress("survivor", 1);
		this.MiscHandler.checkStageTimeAchievements(Game.lvlTime);
		this.MiscHandler.checkStageLvlAchievements(Game.lvl);
		this.ach.resetFail();

		this.score += this.lvl * 10;
		this.combo = 1;
		Game.dot.gainXP(Game.XPpool);
		Game.UI.show_notification('<h3>XP +' + Game.XPpool + '</h3>');
		Game.XPpool = 0;
		this.stats.totalLvlsComplete++;
		Game.lvl++;
		this.saveGame();
		this.UI.show_lvlComplete();
	},

	npcMove: function() {
		var newX;
		var newY;
		var currentNPCCount = (Game.greens.length > Game.reds.length ? Game.greens.length : Game.reds.length);
		// Move dots
		for (var i = 0; i < currentNPCCount; i++) {
			if (Game.greens[i]) {
				Game.greens[i].move()
				if (Game.lvlTime > 1500 && Game.isColliding(Game.dot, Game.greens[i]) && Game.dot.alive) {
					Game.greensContainer.removeChild(Game.greens[i].shape);
					Game.score += Game.greens[i].score * Math.floor(Game.combo);
					this.addMoney(this.greens[i].value);
					this.stats.totalGreens++;
					Game.combo += 0.1;
					this.dot.addHp(5);
					Game.UI.show_combatText('+' + 5, 'heal', Game.dot.shape);
					Game.greens[i].die();
					Game.greens.splice(i, 1);
				}
			}
			if (Game.reds[i]) {
				// Move
				Game.reds[i].update()
				for (j = 0; j < this.dot.allShots.length; j++) {
					if ( Game.isColliding(this.dot.allShots[j], Game.reds[i]) ) {
						this.stats.totalShotsHit++;
						var damageTaken = this.dot.allShots[j].dmg;
						// Combat text
						Game.UI.show_combatText('-' + damageTaken, 'dmg', Game.reds[i].shape);
						if (damageTaken >= this.reds[i].hp * 2.5) {
							this.dot.allShots[j].piercing = true;
						}
						this.dot.allShots[j].dmg -= Math.ceil(Game.reds[i].hp*2);
						Game.reds[i].takeDamage(damageTaken);
						if (Game.reds[i].hp <= 0) {
							this.MiscHandler.checkKillingSpree(1);
							this.MiscHandler.checkMultiKills(++this.dot.allShots[j].kills);
							this.score += Math.floor(this.reds[i].score * Game.combo);
							this.addMoney(this.reds[i].value);
							if (Game.lvl % 10 == 0) {
								this.stats.totalBossKills++;
							} else {
								this.stats.totalRedsKilled++;
							}
							//this.dot.gainXP(Math.floor(this.reds[i].lvl * .5) + 1);
							Game.XPpool += Math.floor(this.reds[i].xp * .5) + 1;
							Game.reds[i].die();
							Game.redsContainer.removeChild(Game.reds[i].shape);
							Game.reds.splice(i, 1);
						}
						if (!this.dot.allShots[j].piercing || (this.dot.allShots[j].piercing && this.dot.allShots[j].dmg <= 0)) {
							Game.dot.allShots[j].die();
							Game.dot.allShots.splice(j, 1);
						}
						break;
					}
				}
				if (Game.reds[i] && Game.lvlTime > 2000 && Game.isColliding(Game.dot, Game.reds[i]) && Game.dot.alive) {
					this.stats.totalRedsHit++;
					Game.ach.fail("survivor");
					Game.combo = 1;
					Game.dot.takeDamage(Game.reds[i].dmg);
					Game.UI.show_combatText('-' + Game.reds[i].dmg, 'dmg', Game.dot.shape);
					Game.reds[i].die();
					Game.redsContainer.removeChild(Game.reds[i].shape);
					Game.reds.splice(i, 1);
				}
			}
		}
		// Move reds shots
		for (i = 0; i < Game.redsShots.length; i++) {
			if (Game.redsShots[i]) {
				Game.redsShots[i].shape.x += Game.redsShots[i].dx * Game.delay;
				Game.redsShots[i].shape.y += Game.redsShots[i].dy * Game.delay;
				// remove shot when out of stage
				if (Game.redsShots[i].shape.x > stageWidth + Game.redsShots[i].rad ||
						Game.redsShots[i].shape.x < 0 - Game.redsShots[i].rad ||
						Game.redsShots[i].shape.y > stageHeight + Game.redsShots[i].rad ||
						Game.redsShots[i].shape.y < 0 - Game.redsShots[i].rad) {
					Game.redsShotContainer.removeChild(Game.redsShots[i].shape);
					Game.redsShots.splice(i,1);
				}
				if (Game.redsShots[i] && Game.dot.immuneTime < Game.lvlTime) {
					if (Game.isColliding(Game.redsShots[i], Game.dot)) {
						Game.ach.fail("survivor");
						Game.combo = 1;
						Game.dot.takeDamage(Game.redsShots[i].dmg);
						Game.UI.show_combatText('-' + Game.redsShots[i].dmg, 'dmg', Game.dot.shape);
						Game.redsShotContainer.removeChild(Game.redsShots[i].shape);
						Game.redsShots.splice(i, 1);
					}
				}
			}

		}
	},

	gameOver: function(restart) {
		Game.restarts++;
		if (!restart) {
			Game.dot.alive = false;
			Game.UI.show_notification("<h2>You died...</h2><h4>Game restarts in 5 seconds</h4>");
			Game.UI.show_notification('<h3>XP +' + Game.XPpool + '</h3>');
			Game.dot.gainXP(Game.XPpool);
			Game.XPpool = 0;
			if (Game.lvl == 10) {
				Game.lvl = 1;
			}
			else if (Game.lvl % 10 == 0) {
				Game.lvl = Game.lvl - 9;
			} else {
				Game.lvl = Math.floor(Game.lvl / 10) * 10 + 1;
			}
			stage.removeChild(Game.dot.shape);
			setTimeout(function(){
				Game.UI.show_gameover();
			}, 5000);
			//Game.UI.show_gameover();
		} else {
			Game.lvl = 1;
			Game.UI.show_gameLoaded();
		}
		Game.totalScore += Game.score;
		Game.score = 0;
		Game.combo = 1;
		Game.saveGame();
	},

	isColliding: function(a, b) {
		var as = a.shape;
		var bs = b.shape;
		var xDistance = Math.abs(as.x - bs.x);
		var yDistance = Math.abs(as.y - bs.y);
		var rad = (a.cRad && b.cRad ? a.cRad + b.cRad : a.rad + b.rad);
		var simple = xDistance < rad && yDistance < rad ? true : false;
		if (simple) {
			var dist = Math.sqrt( Math.pow(xDistance, 2) + Math.pow(yDistance, 2) );
			if (dist < rad) {
				return true;
			}
		}
	},

	collisionRadius: function(rad) {
		var cRad = rad * CRAD;
		if (rad * CRAD < rad - 4) {
			cRad = rad - 4;
		}
		return cRad;
	},

	pauseGame: function() {
		if (Game.play === false || Game.multiplayer === true) {
			return;
		}
		Game.pause = (Game.pause ? false : true);
		if (Game.pause !== true) {
			Game.lastTime = performance.now();
			setTimeout(tick, 1000/Game.fps);
			setTimeout(Game.UI.updateText, Game.UI.textUpdateDelay);
		} else {
			Game.UI.show_notification("<h3>Game is paused</h3><h4>Press 'p' to unpause</h4>");
			var f = setInterval(function() {
				if (!Game.pause) {
					clearInterval(f);
				} else {
					Game.UI.show_notification("<h3>Game is paused</h3><h4>Press 'p' to unpause</h4>");
				}
			}, 6000);
		}
	},

	saveGame: function(exporting) {
		var str = "";
		Game.user = Game.user.replace(/\[|\]|<|>|\/|\\|\{|\}|\s|\(|\)/g, '');
		str += parseFloat(Game.version) + ";" +
		parseInt(Game.lvl) + ";" +
		parseInt(Game.totalScore) + ";" +
		parseInt(Game.money) + ";" +
		parseInt(Game.restarts) + ";" +
		escape(Game.user) + ";" +
		parseInt(Game.score) + ";" + "!END!" +
		parseInt(Game.dot.maxHP) + ";" +
		parseInt(Game.dot.hp) + ";" +
		parseInt(Game.dot.xp) + ";" +
		parseInt(Game.dot.lvl) + ";" +
		parseInt(Game.dot.dmg) + ";" +
		parseInt(Game.dot.shootDelay) + ";" + "!END!";

		str += Game.stats.writeSaveString();
		str += Game.ach.writeSaveString();

		base64Str = btoa(str);
		base64Str = escape(base64Str);
		Game.gameLoaded = true;
		if (exporting) {
			return base64Str;
		} else {
			localStorage.setItem(Game.saveTo, base64Str);
			//console.log("Game saved");
		}
	},

	loadGame: function(data) {
		var str = "";
		if (data) {
			str = data;
		} else {
			str = localStorage.getItem(Game.saveTo);
		}
		str = unescape(str);
		if (str != "") {
			try {
				str = atob(str);
			} catch(InvalidCharacterError) {
				return false;
			}
			var spl = str.split("!END!");
			if (spl.length == 5) {
				var gameData = spl[0].split(";");
				var dotData = spl[1].split(";");
				var statsData = spl[2].split(";");
				var achData = spl[3];
				if (gameData.length != 8 && dotData.length != 7 && statsData.length != 11 && achData.length != 1) {
					return false;
				}
				if (Game.version > parseFloat(gameData[0])) {
					alert("Loaded game data from an old version. Things might be broken!");
				}
				Game.lvl = parseInt(gameData[1]);
				Game.totalScore = parseInt(gameData[2]);
				Game.money = parseInt(gameData[3]);
				Game.restarts = parseInt(gameData[4]);
				Game.user = unescape(gameData[5]);
				Game.user = Game.user.replace(/\[|\]|<|>|\/|\\|\{|\}|\s|\(|\)/g, '');
				Game.score = parseInt(gameData[6]);
				Game.dot.maxHP = parseInt(dotData[0]);
				Game.dot.hp = parseInt(dotData[1]);
				Game.dot.xp = parseInt(dotData[2]);
				Game.dot.lvl = parseInt(dotData[3]);
				Game.dot.dmg = parseInt(dotData[4]);
				Game.dot.shootDelay = parseInt(dotData[5]);
				Game.stats.loadDataString(statsData);
				Game.ach.loadDataString(achData);
				Game.gameLoaded = true;
				Game.saveGame();
				if (data) {
					return true;
				}
			}
		}
	},

	importGame: function() {
		if (Game.play) {
			return false;
		}
		Game.UI.show_popup('<p>Enter saved game data:</p><div class="center-text"><textarea id="game-data"></textarea></div>' +
				'<div class="button" onclick="Game.importGameCode();">Import</div>');
		$("#game-data").focus();
	},

	importGameCode: function() {
		var data = document.getElementById("game-data").value;
		if (Game.loadGame(data)) {
			Game.saveGame();
			Game.start();
			alert("Save imported successfully");
		} else {
			alert("Something is bad with the provided save data");
		}

	},

	exportGame: function() {
		if (Game.play || Game.user == "") {
			return false;
		}
		Game.UI.show_popup('<p>This is your game data:</p><div class="center-text"><textarea id="game-data">'+Game.saveGame(true)+'</textarea></div>');
		$("#game-data").focus().select();
	},

	resetGameData: function() {
		if (Game.user) {
			if (Game.play) {
				Game.pauseGame();
			}
			if (confirm("Wipe game data?")) {
				localStorage.removeItem(Game.saveTo);
				Game.start();
				//console.log("Game data wiped!");
			}
		}
	},

	logic: function() {
		Game.lvlTime += Game.delay;
		// remove a green dot every minute
		/*if (this.lvlTime >= 60000 && this.lvlTime % 60000 <= Game.targetDelay) {
			this.greensContainer.removeChild(this.greens[this.greens.length-1].shape);
			this.greens.splice(this.greens.length-1,1);
		}*/
		if (Game.multiplayer) {
			// let client.js handle shit
			//this.dot.update();
		} else {
			this.dot.update();
			this.npcMove();
			if (Game.dot.hp <= 0) {
				Game.dot.hp = Game.dot.maxHP;
				Game.gameOver();
			}
			if ((this.greens.length == 0 && this.lvl % 10 != 0) || (this.reds.length == 0 && this.lvl % 10 == 0)) {
				Game.play = false;
				this.lvlComplete();
			}
		}

	},

	// helper functions
	addMoney: function(a) {
		this.money += a;
		this.stats.totalMoney += a;
	},

	xpTable: new Array(	// 30 levels, 10 on each line
		0,30,50,100,180,300,450,600,800,1050,
		1300,1600,1900,2250,2600,3000,3450,3900,4400,4950,
		5550,6150,6800,7600,8450,9350,10300,11300,12350,13400
	)

}

/**
 * Fix delay/lag shit!
 */
function tick() {
	var extraTicks = 0;
	var logics = 0;

	Game.timeDiff = performance.now() - Game.lastTime;

	//console.log(Game.timeDiff);

	// Handle slow frame rate and delay
	Game.delay = Game.timeDiff;
	//var accumulatedDelay = Game.delay - Game.targetDelay;
	Game.delay = Game.targetDelay;
	Game.logic();
	//logics++;
	/*extraTicks = Math.floor(accumulatedDelay / Game.targetDelay);
	if (extraTicks > 0) {
		accumulatedDelay -= extraTicks * Game.targetDelay;
	}
	if (accumulatedDelay < Game.targetDelay/2) {
		Game.fps++;
	}
	while (extraTicks > 0 && Game.play) {
		Game.delay = Game.targetDelay;
		Game.logic();
		//logics++;
		extraTicks--;
		Game.fps--;
	}
	while (accumulatedDelay > 1 && Game.play) {
		Game.delay = accumulatedDelay;
		Game.logic();
		//logics++;
		accumulatedDelay -= Game.targetDelay;
	}*/
	Game.lastTime = performance.now();

	//Game.UI.updateText();
	if (Game.multiplayer) {
		Game.stage.update();
	} else {
		stage.update();
	}
	if (Game.play && Game.pause === false) {
		if (!document.hasFocus() && !Game.multiplayer) {
			Game.pauseGame();
		}
		setTimeout(tick, Game.targetDelay);
	}
	if (Game.fps < 60) {
		Game.fps = 60;
	}
	Game.targetDelay = 1000/Game.fps;
}

function handleKeyDown(e) {
	switch (e.keyCode) {
		case 87: Wdown = true; break;
		case 65: Adown = true; break;
		case 83: Sdown = true; break;
		case 68: Ddown = true; break;
		case 80: Game.pauseGame(); break;
	}
}
function handleKeyUp(e) {
	switch (e.keyCode) {
		case 87: Wdown = false; break;
		case 65: Adown = false; break;
		case 83: Sdown = false; break;
		case 68: Ddown = false; break;
	}
}
function handleMouseDown(e) {
	if (e.type == "mousedown" || (e.type == "mousemove" && Game.mouseDown)) {
		Game.mouseDown = true;
		mousedownRepeat(e);
	}
	e.preventDefault();
}
function handleMouseUp(e) {
	Game.mouseDown = false;
}
function mousedownRepeat(e) {
	canvas = $("#game-canvas");
	var x = e.pageX - canvas.offset().left;
	var y = e.pageY - canvas.offset().top;
	if (Game.multiplayer) {
		Game.MP.lastMouseX = x;
		Game.MP.lastMouseY = y;
	} else {
		Game.dot.shootX = x;
		Game.dot.shootY = y;
	}
}

function HTMLEscape(str) {
	var div = document.createElement('div');
	div.appendChild(document.createTextNode(str));
	return div.innerHTML;
}


$("body").on("mouseup", handleMouseUp);
