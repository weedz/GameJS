Game.Dot = function() {
	// Variables
	this.dx = 0.0;
	this.dy = 0.0;
	this.rad = DOT_RAD;
	this.cRad = Game.collisionRadius(this.rad);
	this.maxHP = DOT_DEFAULT_HP;
	this.hp = this.maxHP;
	this.lvl = 1;
	this.xp = 0;
	this.immuneTime = 0;
	this.alive = false;
	this.stat = new Game.Dot.Stat();
	// Shots
	this.shootX = 0;
	this.shootY = 0;
	this.lastShot = 0;
	this.dmg = 1;
	this.baseDmg = 1;
	this.shootDelay = 1150;
	this.allShots = [];

	// function
	this.create();
}

Game.Dot.Stat = function() {
	this.statPoints = 0;
	this.dmgPoints = 5;
	this.hpPoints = 0;
	this.shootDelayPoints = 0;

	this.dmgPointsTodmg = function() {
		return Math.floor(this.dmgPoints/3);
	}
}

//Shot = function() {}

Game.Dot.prototype.create = function() {
	var dotCache = new createjs.Graphics().beginFill("rgb(70,100,240)").drawCircle(0, 0, this.rad);
	this.shape = new createjs.Shape(dotCache);
	this.shape.x = stageWidth/2;
	this.shape.y = stageHeight/2;
	this.shotContainer = new createjs.Container();
}

Game.Dot.prototype.reset = function() {
	this.dx = 0.0;
	this.dy = 0.0;
	this.rad = DOT_RAD;
	this.maxHP = DOT_DEFAULT_HP;
	this.hp = this.maxHP;
	this.lvl = 1;
	this.xp = 0;
}

Game.Dot.prototype.update = function() {
	this.dmg = this.lvl;
	this.move();
	if (Game.mouseDown && this.alive) {
		this.shoot();
	}
	for (i = 0; i < this.allShots.length; i++) {
		if (this.allShots[i]) {
			this.allShots[i].move(this.allShots,i);
			/*this.allShots[i].shape.x += this.allShots[i].dx * Game.delay;
			this.allShots[i].shape.y += this.allShots[i].dy * Game.delay;
			// remove shot when out of stage
			if (this.allShots[i].shape.x > stageWidth + this.allShots[i].rad ||
					this.allShots[i].shape.x < 0 - this.allShots[i].rad ||
					this.allShots[i].shape.y > stageHeight + this.allShots[i].rad ||
					this.allShots[i].shape.y < 0 - this.allShots[i].rad) {
				this.allShots[i].die();
				this.allShots.splice(i,1);
			}*/
		}
	}
}

Game.Dot.prototype.shoot = function() {
	if (performance.now() > this.lastShot + this.shootDelay) {
		Game.stats.totalShotsFired++;
		this.lastShot = performance.now();
		var shotCache = new createjs.Graphics().beginFill("rgb(30,70,220)").drawCircle(0, 0, DOT_RAD/2);
		var tmpShot = new Game.Shot();
		tmpShot.shape = new createjs.Shape(shotCache);

		tmpShot.piercing = false;
		tmpShot.dmg = this.dmg;
		tmpShot.shape.x = this.shape.x;
		tmpShot.shape.y = this.shape.y;
		tmpShot.rad = DOT_RAD/2;
		tmpShot.kills = 0;
		tmpShot.die2 = tmpShot.die;
		tmpShot.die = function() {
			this.die2(Game.dot.shotContainer);
			Game.MiscHandler.multiKills = 0;
			//Game.dot.shotContainer.removeChild(this.shape);
		};
		var angle = Math.atan2(this.shootX - this.shape.x, this.shootY - this.shape.y);
		tmpShot.dy = Math.cos(angle) * SHOT_SPEED;
		tmpShot.dx = Math.sin(angle) * SHOT_SPEED;

		this.allShots.push(tmpShot);

		this.shotContainer.addChild(tmpShot.shape);
	}
}

Game.Dot.prototype.takeDamage = function(dmg) {
	if (!this.alive) {
		return false;
	}
	Game.ach.fail("survivor");
	Game.stats.totalDamageTaken += dmg;
	this.hp -= dmg;
	this.immuneTime = Game.lvlTime + 1000;
}

Game.Dot.prototype.newLvl = function() {
	this.shotContainer = new createjs.Container();
	this.allShots = [];
	this.dx = 0;
	this.dy = 0;
	this.shape.x = stageWidth/2;
	this.shape.y = stageHeight/2;
	this.immuneTime = 2000;
	this.alive = true;
}

Game.Dot.prototype.addHp = function(hp) {
	this.hp += hp;
	if (this.hp > this.maxHP) {
		this.hp = this.maxHP;
	}
}

Game.Dot.prototype.gainXP = function(xp) {
	this.xp += xp;
	if (this.lvl < Game.xpTable.length && this.xp >= Game.xpTable[this.lvl]) {
		var overflow = this.xp - Game.xpTable[this.lvl];
		this.lvl++;
		this.xp = 0;
		//this.xp = overflow;
		this.gainXP(overflow);
	}
}

Game.Dot.prototype.move = function() {
	var newY = this.shape.y;
	var newX = this.shape.x;
	var calcDEC = DOT_DEC * Game.delay;
	var calcACC = DOT_ACC * Game.delay;

	// Accelerate
	if (Wdown) {
		if (this.dy - calcACC <= -DOT_MAXSPEED) {
			this.dy = -DOT_MAXSPEED;
		} else {
			this.dy -= calcACC;
		}
	} if (Sdown) {
		if (this.dy + calcACC >= DOT_MAXSPEED) {
			this.dy = DOT_MAXSPEED;
		} else {
			this.dy += calcACC;
		}
	} if (Adown) {
		if (this.dx - calcACC <= -DOT_MAXSPEED) {
			this.dx = -DOT_MAXSPEED;
		} else {
			this.dx -= calcACC;
		}
	} if (Ddown) {
		if (this.dx + calcACC >= DOT_MAXSPEED) {
			this.dx = DOT_MAXSPEED;
		} else {
			this.dx += calcACC;
		}
	}
	// Decelerate
	if (!Wdown  && !Sdown && this.dy != 0) {
		if (this.dy > 0) {
			this.dy -= calcDEC;
			if (this.dy <= 0) {
				this.dy = 0;
			}
		}
		if (this.dy < 0) {
			this.dy += calcDEC;
			if (this.dy >= 0) {
				this.dy = 0;
			}
		}
	}
	if (!Adown  && !Ddown && this.dx != 0) {
		if (this.dx > 0) {
			this.dx -= calcDEC;
			if (this.dx <= 0) {
				this.dx = 0;
			}
		}
		if (this.dx < 0) {
			this.dx += calcDEC;
			if (this.dx >= 0) {
				this.dx = 0;
			}
		}
	}
	// Move stuff
	newY += this.dy * Game.delay;
	newX += this.dx * Game.delay;
	// Check out of box
	if (newX + this.rad > stageWidth) {
		this.shape.x = stageWidth - this.rad;
		this.dx = 0;
	} else if (newX - this.rad < 0) {
		this.shape.x = this.rad;
		this.dx = 0;
	} else {
		this.shape.x = newX;
	}
	if (newY + this.rad > stageHeight) {
		this.shape.y = stageHeight - this.rad;
		this.dy = 0;
	} else if (newY - this.rad < 0) {
		this.shape.y = this.rad;
		this.dy = 0;
	} else {
		this.shape.y = newY;
	}
}
