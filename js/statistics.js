Game.Statistics = function() {
	this.totalMoney = 0;
	this.totalShotsFired = 0;
	this.totalShotsHit = 0;
	this.totalGreens = 0;
	this.totalRedsKilled = 0;
	this.totalRedsHit = 0;
	this.totalBossKills = 0;
	this.totalDeathsByBoss = 0;
	this.totalLvlsComplete = 0;
	this.totalDamageTaken = 0;
	
	this.writeSaveString = function() {
		var str = "";
		str += parseInt(this.totalMoney) + ";" + 
		parseInt(this.totalShotsFired) + ";" + 
		parseInt(this.totalShotsHit) + ";" + 
		parseInt(this.totalGreens) + ";" +
		parseInt(this.totalRedsKilled) + ";" +
		parseInt(this.totalRedsHit) + ";" +
		parseInt(this.totalBossKills) + ";" + 
		parseInt(this.totalDeathsByBoss) + ";" + 
		parseInt(this.totalLvlsComplete) + ";" + 
		parseInt(this.totalDamageTaken) + ";" + "!END!";
		return str;
	}
	
	this.loadDataString = function(data) {
		this.totalMoney = parseInt(data[0]);
		this.totalShotsFired = parseInt(data[1]);
		this.totalShotsHit = parseInt(data[2]);
		this.totalGreens = parseInt(data[3]);
		this.totalRedsKilled = parseInt(data[4]);
		this.totalRedsHit = parseInt(data[5]);
		this.totalBossKills = parseInt(data[6]);
		this.totalDeathsByBoss = parseInt(data[7]);
		this.totalLvlsComplete = parseInt(data[8]);
		this.totalDamageTaken = parseInt(data[9]);
	}
}

Game.MiscHandler = {
	killingSpree: 0,
	
	checkMultiKills: function(kills) {
		Game.ach.updateProgress("pentakill", kills);
		Game.ach.updateProgress("quadkill", kills);
		Game.ach.updateProgress("tripplekill", kills);
		Game.ach.updateProgress("doublekill", kills);
	},
	
	checkStageTimeAchievements: function(time) {
		if (time < 30000) {
			Game.ach.updateProgress("inahurry", 1);
		}
	},
	
	checkStageLvlAchievements: function(lvl) {
		if (lvl == 10) {
			Game.ach.updateProgress("firstboss", 1);
		}
	},
	
	checkKillingSpree: function(add) {
		if (this.killingSpree == 0) {
			setTimeout(this.timeout_killingSpree, 10000);
		}
		this.killingSpree += add;
		if (this.killingSpree >= NPC_COUNT) {
			Game.ach.updateProgress("killingspree", 1);
		}
	},
	
	timeout_killingSpree: function() {
		Game.MiscHandler.killingSpree = 0;
	}
}