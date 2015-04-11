cjs = {}

cjs.stage = function(canvasElement) {
	
	var canvas = document.getElementById(canvasElement);
	var ctx = canvas.getContext('2d');
	
	update = function() {
		
	}
	
}

cjs.Graphic = function() {
	
}

cjs.graphics = {
	
	beginFill: function(color) {
		var g = new cjs.Graphic();
		g.beginFill(color);
		return g;
	},
	
	drawRect: function(x, y, width, height) {
		
		return new cjs.Graphic();
	}
	
}