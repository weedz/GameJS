Game.Shot = function() {
    this.type = null;
    this.dmg = 0;
    this.dx = 0;
    this.dy = 0;
    this.piercing = false;
    this.kills = 0;
    this.rad = 1;
    this.shape = null;

    this.die = function(c) {
        c.removeChild(this.shape);
    }

    this.move = function(a, b, c) {
        this.shape.x += this.dx * Game.delay;
        this.shape.y += this.dy * Game.delay;
        // remove shot when out of stage
        if (this.shape.x > stageWidth + this.rad ||
            this.shape.x < 0 - this.rad ||
            this.shape.y > stageHeight + this.rad ||
            this.shape.y < 0 - this.rad) {
                this.die(c);
                //this.allShots.splice(i,1);
                a.splice(b,1);
            }
    }
}
