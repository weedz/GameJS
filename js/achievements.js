Game.Achievements = function() {
	this.totalPoints = 200;
	this.points = 0;
	this.list = {
		doublekill: {
			progress: 0,
			progressComplete: 2,
			points: 10,
			fullname: "Double Kill!",
			description: "Kill two red dots with the same shot",
			complete: false
		},
		tripplekill: {
			progress: 0,
			progressComplete: 3,
			points: 20,
			fullname: "Tripple Kill!",
			description: "Kill three red dots with the same shot",
			complete: false
		},
		quadkill: {
			progress: 0,
			progressComplete: 4,
			points: 30,
			fullname: "Quadra kill!",
			description: "Kill four red dots with the same shot",
			complete: false
		},
		pentakill: {
			progress: 0,
			progressComplete: 5,
			points: 50,
			fullname: "Penta kill!!",
			description: "Kill five red dots with the same shot",
			complete: false
		},
		survivor: {
			progress: 0,
			progressComplete: 1,
			points: 20,
			fullname: "Survivor",
			description: "Clear a stage without taking any form of damage",
			complete: false,
			canComplete: true
		},
		inahurry: {
			progress: 0,
			progressComplete: 1,
			points: 10,
			fullname: "In a hurry!",
			description: "Clear a stage in less than 30 seconds",
			complete: false
		},
		firstboss: {
			progress: 0,
			progressComplete: 1,
			points: 10,
			fullname: "First boss",
			description: "Clear stage 10",
			complete: false
		},
		killingspree: {
			progress: 0,
			progressComplete: 1,
			points: 50,
			fullname: "Killing Spree!!!",
			description: "Kill 20 red dots in less than 10 seconds",
			complete: false
		}
	};
	
	this.resetProgress = function(achievement) {
		if (this.list[achievement].complete === false) {
			this.list[achievement].progress = 0;
		} else {
			return false;
		}
	}
	
	this.updateProgress = function(achievement, a) {
		if (this.list[achievement].complete === false) {
			if ( (this.list[achievement].canComplete && this.list[achievement].canComplete === true) || this.list[achievement].canComplete == undefined) {
				this.list[achievement].progress = a;
			}
			if (this.list[achievement].progress >= this.list[achievement].progressComplete) {
				this.list[achievement].complete = true;
				this.list[achievement].progress = this.list[achievement].progressComplete;
				this.points += this.list[achievement].points;
				Game.UI.show_notification(
				'<h3>Achievement Complete</h3>' + 
				'<h4>' + this.list[achievement].fullname + '</h4>');
			}
		} else {
			return false;
		}
	}
	
	this.fail = function(achievement) {
		if (this.list[achievement] && this.list[achievement].canComplete && this.list[achievement].complete === false) {
			this.list[achievement].canComplete = false;
		} else {
			return false;
		}
	}
	
	this.resetFail = function(achievement) {
		if (achievement) {
			if (this.list[achievement].canComplete) {
				this.list[achievement].canComplete = true;
			}
		} else {
			for (a in this.list) {
				if (this.list[a].canComplete != undefined) {
					this.list[a].canComplete = true;
				}
			}
		}
	}
	
	this.writeSaveString = function() {
		var str = "";
		str += parseInt(this.points) + ";" + "!ACH!";
		for (a in this.list) {
			str += a + ";" + 
			parseInt(this.list[a].progress) + ";" + 
			this.list[a].complete + ";" + "!ACH!";
		}
		str += "!END!";
		return str;
	}
	
	this.loadDataString = function(data) {
		var achArray = data.split("!ACH!");
		var ach = achArray[0].split(";");
		this.points = parseInt(ach[0]);
		for (var i = 1; i < achArray.length - 1; i++) {
			ach = achArray[i].split(";");
			if (ach.length == 4) {
				this.list[ach[0]].progress = parseInt(ach[1]);
				this.list[ach[0]].complete = ach[2] == "true" ? true : false;
			}
		}
	}
}
