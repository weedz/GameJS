GreenDot = function() {
	this.dx = -NPC_MAXSPEED + (Math.random() * 2*NPC_MAXSPEED);
	this.dy = -NPC_MAXSPEED + (Math.random() * 2*NPC_MAXSPEED);
	this.rad = NPC_RAD-1;	// default: NPC_RAD-1
	this.cRad = Game.collisionRadius(this.rad);
	this.score = Math.ceil(Game.lvl/3);
	this.value = Math.ceil(Game.lvl/3);
	this.alive = true;
	this.create();
}

GreenDot.prototype.create = function() {
	var tmpGraphics = new createjs.Graphics().beginFill("rgb(0,180,0)").drawCircle(0, 0, this.rad)
	this.shape = new createjs.Shape(tmpGraphics);
	this.shape.x = this.rad + Math.random() * (stageWidth-2*this.rad);
	this.shape.y = this.rad + Math.random() * (stageHeight-2*this.rad);
}

GreenDot.prototype.update = function() {
	if (!this.alive) {
		return false;
	}
	this.move();
};

GreenDot.prototype.move = function() {
	if (!this.alive) {
		return false;
	}
	var newX = this.shape.x + this.dx * Game.delay;
	var newY = this.shape.y + this.dy * Game.delay;
	if ((newX + this.rad > stageWidth) || (newX - this.rad < 0)) {
		this.dx *= -1;
	}
	if ((newY + this.rad > stageHeight) || (newY - this.rad < 0)) {
		this.dy *= -1;
	}
	this.shape.x += this.dx * Game.delay;
	this.shape.y += this.dy * Game.delay;
}

GreenDot.prototype.die = function() {
	this.alive = false;
	this.x = 0;
	this.y = 0;
	this.dx = 0;
	this.dy = 0;
	this.rad = 0;
	this.score = 0;
	this.value = 0;
}