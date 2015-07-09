RedDot = function(level) {
	if (level == 'undefined') {
		level = Game.lvl;
	}
	this.level = level == 'undefined' ? Game.lvl : level;
	this.dx = level % 10 == 0 ? -1.5*NPC_MAXSPEED + Math.random() * 3*NPC_MAXSPEED : -NPC_MAXSPEED + Math.random() * 2*NPC_MAXSPEED;
	this.dy = level % 10 == 0 ? -1.5*NPC_MAXSPEED + Math.random() * 3*NPC_MAXSPEED : -NPC_MAXSPEED + Math.random() * 2*NPC_MAXSPEED;
	this.rad = level % 10 == 0 ? NPC_RAD*8 : NPC_RAD+1;
	this.cRad = Game.collisionRadius(this.rad);
	this.dmg = level % 10 == 0 ? Game.dot.maxHP : 25;
	this.maxHP = level * Math.floor(Game.lvl/5 + 1);
	if (level % 10 == 0) {
		this.maxHP *= 40;
		this.lastShot2 = performance.now() + 5000;
	}
	this.hp = this.maxHP;
	this.value = level % 10 == 0 ? level*40 : level;
	this.score = level % 10 == 0 ? level*40 : level;
	this.lvl = level % 10 == 0 ? level*40 : level;
	this.lastShot = performance.now() + Math.floor(Math.random() * 5000);
	this.shootDelay = level % 10 == 0 ? 160 : 400;
	this.alive = true;
	this.create();
	this.xp = this.hp;
}

RedDot.prototype.create = function() {
	var tmpGraphics = new createjs.Graphics().beginFill("rgb(230,0,0)").drawCircle(0, 0, this.rad)
	this.shape = new createjs.Shape(tmpGraphics);
	this.shape.x = this.rad + Math.random() * (stageWidth-2*this.rad);
	this.shape.y = this.rad + Math.random() * (stageHeight-2*this.rad);
}

RedDot.prototype.update = function() {
	if (!this.alive) {
		return false;
	}
	if (Game.dot.alive) {
		if (this.level % 10 == 0) {
			if (Game.lastTime > this.lastShot) {
				this.lastShot = Game.lastTime + this.shootDelay;
				if (Math.random() < .8) {
					this.shoot();
				}
			}
			if (Game.lastTime > this.lastShot2 && Game.reds.length < 10) {
				this.lastShot2 = Game.lastTime + this.shootDelay + 6000;
				tmpRed = new RedDot(Game.lvl - 5);
				tmpRed.xp = 1;
				tmpRed.setShotDelay(400);
				tmpRed.dx = 0;
				tmpRed.dy = 0;
				tmpRed.shape.x = this.shape.x;
				tmpRed.shape.y = this.shape.y;
				tmpRed.setHP(Game.lvl);
				tmpRed.lastShot = 0;
				Game.reds.push(tmpRed);
				Game.redsContainer.addChild(Game.reds[Game.reds.length-1].shape);
			}
		}
		else if (Game.lastTime > this.lastShot + this.shootDelay) {
			this.lastShot = Game.lastTime + this.shootDelay;
			if (Math.random() < .25 * ((NPC_COUNT/2)/Game.reds.length)) {
				this.shoot();
			}
		}
	}
	this.move();
}

RedDot.prototype.setShotDelay = function(delay) {
	this.shootDelay = delay;
}

RedDot.prototype.setHP = function(hp) {
	this.hp = hp;
	this.maxHP = hp;
}

RedDot.prototype.shoot = function() {
	var shotCache = new createjs.Graphics().beginFill("rgb(180,0,0)").drawCircle(0, 0, (NPC_RAD+2)/2);
	var tmpShot = new Game.Shot();
	tmpShot.shape = new createjs.Shape(shotCache);

	tmpShot.dmg = 5;
	tmpShot.shape.x = this.shape.x;
	tmpShot.shape.y = this.shape.y;
	tmpShot.rad = (NPC_RAD+2)/2;
	var angle = Math.atan2(Game.dot.shape.x - this.shape.x, Game.dot.shape.y - this.shape.y);
	angle = angle - (this.level % 10 == 0 ? 1.0 : .4) + (Math.random() * (this.level % 10 == 0 ? 2.0  : .8));
	tmpShot.dy = Math.cos(angle) * SHOT_SPEED;
	tmpShot.dx = Math.sin(angle) * SHOT_SPEED;

	Game.redsShots.push(tmpShot);
	Game.redsShotContainer.addChild(tmpShot.shape);
}

RedDot.prototype.move = function() {
	newX = this.shape.x + this.dx * Game.delay;
	newY = this.shape.y + this.dy * Game.delay;
	if ((newX + this.rad > stageWidth) || (newX - this.rad < 0)) {
		this.dx *= -1;
	}
	if ((newY + this.rad > stageHeight) || (newY - this.rad < 0)) {
		this.dy *= -1;
	}
	this.shape.x += this.dx * Game.delay;
	this.shape.y += this.dy * Game.delay;
	if (this.hpBar) {
		this.hpBar.x = this.shape.x;
		this.hpBar.y = this.shape.y - this.rad;
		if (this.hpBar.y < this.rad+2) {
			this.hpBar.y = this.rad+2;
		}
	}
}

RedDot.prototype.takeDamage = function(dmg) {
	var ratio = (this.hp - dmg) / this.maxHP;
	this.hp -= dmg;
	if (!this.hpBar) {
		this.hpBar = new createjs.Container();
		var tmpBG = new createjs.Graphics().beginFill("rgb(250,0,0)").drawRect(-this.rad, -this.rad*.5, this.rad*2, this.level % 10 == 0 ? 12 : 6);
		var bg = new createjs.Shape(tmpBG);
		this.hpBar.addChildAt(bg, 0);

		var health = new createjs.Shape();
		health.graphics.beginFill("rgb(0,250,0)").drawRect(-this.rad, -this.rad*.5, this.rad*2, this.level % 10 == 0 ? 12 : 6);
		this.hpBar.addChildAt(health, 1);

		this.hpBar.x = this.shape.x;
		this.hpBar.y = this.shape.y - this.rad
		stage.addChild(this.hpBar);
	}
	var health = this.hpBar.getChildAt(1);
	health.scaleX = ratio;
}

RedDot.prototype.die = function() {
	stage.removeChild(this.hpBar);
	this.alive = false;
	this.x = 0;
	this.y = 0;
	this.dx = 0;
	this.dy = 0;
	this.rad = 0;
	this.value = 0;
	this.score = 0;
}
