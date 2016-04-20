/*
 * TODO:
 *	See ../todo.html
 */

const stageWidth = 900;
const stageHeight = 700;
const canvasName = "game-canvas";

var stage = ""; //new createjs.Stage(canvasName);

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
var Wdown, Adown, Sdown, Ddown;

var Game;

Game = {
	saveTo: "TheDotSave",
	version: 0.044,
	versionString: '0.044git-b',
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
		this.user = "";
		this.gameLoaded = false;
		this.fps = 60;
		this.targetDelay = 1000 / this.fps;
		this.play = false;
		this.pause = false;
		this.multiplayer = false;
		this.XPpool = 0;
		document.onkeydown = handleKeyDown;
		document.onkeyup = handleKeyUp;
		this.start();
	},

	start: function () {
		this.dot = new Game.Dot();
		this.stats = new Game.Statistics();
		this.ach = new Game.Achievements();
		this.user = "";
		this.restarts = 0;
		this.lvl = 1;
		this.money = 0;
		this.totalScore = 0;
		this.score = 0;
		this.lvlTime = 0;
		this.combo = 1;
		this.gameLoaded = false;
		this.loadGame();
		this.UI.init();
	},

	initLvl: function () {
		this.greensContainer = new createjs.Container();
		this.redsContainer = new createjs.Container();
		this.redsShotContainer = new createjs.Container();
		this.redsContainer.addChild(this.redsShotContainer);
		this.redsShots = [];
		this.greens = [NPC_COUNT / 2];
		this.reds = [NPC_COUNT];
		this.dot.newLvl();

		this.timeDiff = 0;
		this.delay = 0;
		this.lastTime = performance.now();

		this.combo = 1;
		this.lvlTime = 0;

		this.UI.show_game();
		this.startLvl();
		this.play = true;
		this.pause = false;
		setTimeout(tick, 1000 / this.fps);
		setTimeout(this.UI.updateText, this.UI.textUpdateDelay);
	},

	nextLvl: function () {
		this.initLvl();
	},

	startLvl: function () {
		for (var i = 0; i < NPC_COUNT; i++) {
			if (i < NPC_COUNT / 2) {
				this.greens[i] = new GreenDot();
				this.greensContainer.addChild(this.greens[i].shape);
			}
			if (this.lvl % 10 != 0) {
				this.reds[i] = new RedDot(this.lvl);
				this.redsContainer.addChild(this.reds[i].shape);
			}
		}
		if (this.lvl % 10 == 0) {
			this.reds[0] = new RedDot(this.lvl);
			this.redsContainer.addChild(this.reds[0].shape);
		}
	},

	startMultiplayerSession: function () {
		/*this.multiplayer = true;
		 this.dot = new this.Dot();
		 $("body").on("mousedown mousemove", handleMouseDown);
		 this.stage = new createjs.Stage(canvasName);
		 this.stage.addChild(this.dot.shape);
		 this.stage.addChild(this.dot.shotContainer);
		 setTimeout(tick, 1000 / this.fps);
		 this.play = true;
		 this.pause = false;
		 this.MP.connection.connect();*/
	},

	lvlComplete: function () {
		this.ach.updateProgress("survivor", 1);
		this.MiscHandler.checkStageTimeAchievements(this.lvlTime);
		this.MiscHandler.checkStageLvlAchievements(this.lvl);
		this.ach.resetFail();

		this.score += this.lvl * 10;
		this.combo = 1;
		this.dot.gainXP(this.XPpool);
		this.UI.show_notification('<h3>XP +' + this.XPpool + '</h3>');
		this.XPpool = 0;
		this.stats.totalLvlsComplete++;
		this.lvl++;
		this.saveGame();
		this.UI.show_lvlComplete();
	},

	npcMove: function () {
		var currentNPCCount = (this.greens.length > this.reds.length ? this.greens.length : this.reds.length);
		// Move dots
		for (var i = 0; i < currentNPCCount; i++) {
			if (this.greens[i]) {
				this.greens[i].update();
				if (this.lvlTime > 1500 && this.isColliding(this.dot, this.greens[i]) && this.dot.alive) {
					this.greensContainer.removeChild(this.greens[i].shape);
					this.score += this.greens[i].score * Math.floor(this.combo);
					this.addMoney(this.greens[i].value);
					this.stats.totalGreens++;
					this.combo += 0.1;
					this.dot.addHp(5);
					this.UI.show_combatText('+' + 5, 'heal', this.dot.shape);
					this.greens[i].die();
					this.greens.splice(i, 1);
				}
			}
			if (this.reds[i]) {
				// Move
				this.reds[i].update();
				for (var j = 0; j < this.dot.allShots.length; j++) {
					if (this.isColliding(this.dot.allShots[j], this.reds[i])) {
						this.stats.totalShotsHit++;
						var damageTaken = this.dot.allShots[j].dmg;
						// Combat text
						this.UI.show_combatText('-' + damageTaken, 'dmg', this.reds[i].shape);
						if (damageTaken >= this.reds[i].hp * 2.5) {
							this.dot.allShots[j].piercing = true;
						}
						this.dot.allShots[j].dmg -= Math.ceil(this.reds[i].hp * 2);
						this.reds[i].takeDamage(damageTaken);
						if (this.reds[i].hp <= 0) {
							this.MiscHandler.checkKillingSpree(1);
							this.MiscHandler.checkMultiKills(++this.dot.allShots[j].kills);
							this.score += Math.floor(this.reds[i].score * this.combo);
							this.addMoney(this.reds[i].value);
							if (this.lvl % 10 == 0) {
								this.stats.totalBossKills++;
							} else {
								this.stats.totalRedsKilled++;
							}
							this.XPpool += Math.floor(this.reds[i].xp * .5) + 1;
							this.reds[i].die();
							this.redsContainer.removeChild(this.reds[i].shape);
							this.reds.splice(i, 1);
						}
						if (!this.dot.allShots[j].piercing || (this.dot.allShots[j].piercing && this.dot.allShots[j].dmg <= 0)) {
							this.dot.allShots[j].die();
							this.dot.allShots.splice(j, 1);
						}
						break;
					}
				}
				if (this.reds[i] && this.lvlTime > 2000 && this.isColliding(this.dot, this.reds[i]) && this.dot.alive) {
					this.stats.totalRedsHit++;
					this.ach.fail("survivor");
					this.combo = 1;
					this.dot.takeDamage(this.reds[i].dmg);
					this.UI.show_combatText('-' + this.reds[i].dmg, 'dmg', this.dot.shape);
					this.reds[i].die();
					this.redsContainer.removeChild(this.reds[i].shape);
					this.reds.splice(i, 1);
				}
			}
		}
		// Move reds shots
		for (i = 0; i < this.redsShots.length; i++) {
			if (this.redsShots[i]) {
				this.redsShots[i].move(this.redsShots, i, this.redsShotContainer);
				/*this.redsShots[i].shape.x += this.redsShots[i].dx * this.delay;
				 this.redsShots[i].shape.y += this.redsShots[i].dy * this.delay;
				 // remove shot when out of stage
				 if (this.redsShots[i].shape.x > stageWidth + this.redsShots[i].rad ||
				 this.redsShots[i].shape.x < 0 - this.redsShots[i].rad ||
				 this.redsShots[i].shape.y > stageHeight + this.redsShots[i].rad ||
				 this.redsShots[i].shape.y < 0 - this.redsShots[i].rad) {
				 //this.redsShotContainer.removeChild(this.redsShots[i].shape);
				 this.redsShots[i].die(this.redsShotContainer);
				 this.redsShots.splice(i,1);
				 }*/
				if (this.redsShots[i] && this.dot.immuneTime < this.lvlTime) {
					if (this.isColliding(this.redsShots[i], this.dot)) {
						this.ach.fail("survivor");
						this.combo = 1;
						this.dot.takeDamage(this.redsShots[i].dmg);
						this.UI.show_combatText('-' + this.redsShots[i].dmg, 'dmg', this.dot.shape);
						//this.redsShotContainer.removeChild(this.redsShots[i].shape);
						this.redsShots[i].die(this.redsShotContainer);
						this.redsShots.splice(i, 1);
					}
				}
			}

		}
	},

	gameOver: function (restart) {
		this.restarts++;
		if (!restart) {
			this.dot.alive = false;
			this.UI.show_notification("<h2>You died...</h2><h4>Game restarts in 5 seconds</h4>");
			this.UI.show_notification('<h3>XP +' + this.XPpool + '</h3>');
			this.dot.gainXP(this.XPpool);
			this.XPpool = 0;
			if (this.lvl == 10) {
				this.lvl = 1;
			}
			else if (this.lvl % 10 == 0) {
				this.lvl = this.lvl - 9;
			} else {
				this.lvl = Math.floor(this.lvl / 10) * 10 + 1;
			}
			stage.removeChild(this.dot.shape);
			setTimeout(function () {
				Game.UI.show_gameover();
			}, 5000);
		} else {
			this.lvl = 1;
			this.UI.show_gameLoaded();
		}
		this.totalScore += this.score;
		this.score = 0;
		this.combo = 1;
		this.saveGame();
	},

	isColliding: function (a, b) {
		var as = a.shape;
		var bs = b.shape;
		var xDistance = Math.abs(as.x - bs.x);
		var yDistance = Math.abs(as.y - bs.y);
		var rad = (a.cRad && b.cRad ? a.cRad + b.cRad : a.rad + b.rad);
		var simple = !!(xDistance < rad && yDistance < rad);
		if (simple) {
			var dist = Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
			if (dist < rad) {
				return true;
			}
		}
	},

	collisionRadius: function (rad) {
		var cRad = rad * CRAD;
		if (rad * CRAD < rad - 4) {
			cRad = rad - 4;
		}
		return cRad;
	},

	pauseGame: function () {
		if (this.play === false || this.multiplayer === true) {
			return;
		}
		this.pause = (this.pause ? false : true);
		if (this.pause !== true) {
			this.lastTime = performance.now();
			setTimeout(tick, 1000 / this.fps);
			setTimeout(this.UI.updateText, this.UI.textUpdateDelay);
		} else {
			this.UI.show_notification("<h3>Game is paused</h3><h4>Press 'p' to unpause</h4>");
			var tmpGame = Game;
			var f = setInterval(function () {
				if (!tmpGame.pause) {
					clearInterval(f);
				} else {
					tmpGame.UI.show_notification("<h3>Game is paused</h3><h4>Press 'p' to unpause</h4>");
				}
			}, 4000);
		}
	},

	saveGame: function (exporting) {
		var str = "";
		this.user = this.user.replace(/\[|\]|<|>|\/|\\|\{|\}|\s|\(|\)/g, '');
		str += parseFloat(this.version) + ";" +
			parseInt(this.lvl) + ";" +
			parseInt(this.totalScore) + ";" +
			parseInt(this.money) + ";" +
			parseInt(this.restarts) + ";" +
			escape(this.user) + ";" +
			parseInt(this.score) + ";" + "!END!" +
			parseInt(this.dot.maxHP) + ";" +
			parseInt(this.dot.hp) + ";" +
			parseInt(this.dot.xp) + ";" +
			parseInt(this.dot.lvl) + ";" +
			parseInt(this.dot.dmg) + ";" +
			parseInt(this.dot.shootDelay) + ";" + "!END!";

		str += this.stats.writeSaveString();
		str += this.ach.writeSaveString();

		base64Str = btoa(str);
		base64Str = escape(base64Str);
		this.gameLoaded = true;
		if (exporting) {
			return base64Str;
		} else {
			localStorage.setItem(this.saveTo, base64Str);
		}
	},

	loadGame: function (data) {
		var str = "";
		if (data) {
			str = data;
		} else {
			str = localStorage.getItem(this.saveTo);
		}
		str = unescape(str);
		if (str != "") {
			try {
				str = atob(str);
			} catch (InvalidCharacterError) {
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
				if (this.version > parseFloat(gameData[0])) {
					alert("Loaded game data from an old version. Things might be broken!");
				}
				this.lvl = parseInt(gameData[1]);
				this.totalScore = parseInt(gameData[2]);
				this.money = parseInt(gameData[3]);
				this.restarts = parseInt(gameData[4]);
				this.user = unescape(gameData[5]);
				this.user = this.user.replace(/\[|\]|<|>|\/|\\|\{|\}|\s|\(|\)/g, '');
				this.score = parseInt(gameData[6]);
				this.dot.maxHP = parseInt(dotData[0]);
				this.dot.hp = parseInt(dotData[1]);
				this.dot.xp = parseInt(dotData[2]);
				this.dot.lvl = parseInt(dotData[3]);
				this.dot.dmg = parseInt(dotData[4]);
				this.dot.shootDelay = parseInt(dotData[5]);
				this.stats.loadDataString(statsData);
				this.ach.loadDataString(achData);
				this.gameLoaded = true;
				this.saveGame();
				if (data) {
					return true;
				}
			}
		}
	},

	importGame: function () {
		if (this.play) {
			return false;
		}
		this.UI.show_popup('<p>Enter saved game data:</p><div class="center-text"><textarea id="game-data"></textarea></div>' +
			'<div class="button" onclick="Game.importGameCode();">Import</div>');
		$("#game-data").focus();
	},

	importGameCode: function () {
		var data = document.getElementById("game-data").value;
		if (this.loadGame(data)) {
			this.saveGame();
			this.start();
			alert("Save imported successfully");
		} else {
			alert("Something is bad with the provided save data");
		}

	},

	exportGame: function () {
		if (this.play || this.user == "") {
			return false;
		}
		this.UI.show_popup('<p>This is your game data:</p><div class="center-text"><textarea id="game-data">' + this.saveGame(true) + '</textarea></div>');
		$("#game-data").focus().select();
	},

	resetGameData: function () {
		if (this.user) {
			if (this.play) {
				this.pauseGame();
			}
			if (confirm("Wipe game data?")) {
				localStorage.removeItem(this.saveTo);
				this.start();
			}
		}
	},

	logic: function () {
		this.lvlTime += this.delay;
		if (this.multiplayer) {
			// let client.js handle shit
			//this.dot.update();
		} else {
			this.dot.update();
			this.npcMove();
			if (this.dot.hp <= 0) {
				if (this.lvl % 10 == 0) {
					this.stats.totalDeathsByBoss++;
				}
				this.dot.hp = this.dot.maxHP;
				this.gameOver();
			}
			if ((this.greens.length == 0 && this.lvl % 10 != 0) || (this.reds.length == 0 && this.lvl % 10 == 0)) {
				this.play = false;
				this.lvlComplete();
			}
		}

	},

	// helper functions
	addMoney: function (money) {
		this.money += money;
		this.stats.totalMoney += money;
	},

	xpTable: [	// 30 levels, 10 on each line
		0, 30, 50, 100, 180, 300, 450, 600, 800, 1050,
		1300, 1600, 1900, 2250, 2600, 3000, 3450, 3900, 4400, 4950,
		5550, 6150, 6800, 7600, 8450, 9350, 10300, 11300, 12350, 13400
	]

};

/**
 * Fix delay/lag shit!
 */
function tick() {

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
function handleMouseUp() {
	Game.mouseDown = false;
}
function mousedownRepeat(e) {
	var canvas = $("#game-canvas");
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
