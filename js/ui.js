Game.UI = {
	textUpdateDelay: 250,
	notTimeout: [],
	combatTextTimeout: [],
	
	clearAll: function() {
		window.getSelection().removeAllRanges();
		Game.play = false;
		$('#game-content').off("click");
		$('body').off("mousedown mousemove");
		if (Game.pause === false) {
			$("#game-content").html("");
			if (stage) {
				stage.removeAllChildren();
			}
		} else {
			$("#game-canvas").hide();
		}
	},
	
	init: function() {
		$("#game nav").on("click", ".link-main", function(){Game.UI.show_main()});
		$("#game nav").on("click", ".link-shop", function(){Game.UI.show_page(Game.UI.shop_startPage)});
		$("#game nav").on("click", ".link-afkfarm", function(){Game.UI.show_page(Game.UI.afkfarm_startPage)});
		$("#game nav").on("click", ".link-achievements", function(){Game.UI.show_achievements()});
		$("#game nav").on("click", ".link-stats", function(){Game.UI.show_stats()});
		$("#game nav").on("click", ".link-multiplayer", function() {Game.UI.show_multiplayer()});
		$("#game nav").on("click", ".link-options", function() {Game.UI.show_page(Game.UI.options_startPage)});
		Game.UI.updateText();
		if (Game.gameLoaded == false) {
			this.show_start();
			return;
		}
		switch (window.location.hash) {
			case '#main':
				this.show_main();
			break;
			case '#shop':
				this.show_page(this.shop_startPage);
			break;
			case '#afkfarm':
				this.show_page(this.afkfarm_startPage);
			break;
			case '#achievements':
				this.show_achievements();
			break;
			case '#stats':
				this.show_stats();
			break;
			case '#multiplayer':
				this.show_multiplayer();
			break;
			case '#options':
				this.show_page(this.options_startPage);
			break;
			default:
				this.show_main();
		}
	},
	
	show_start: function() {
		this.clearAll();
		$("#game-content").append(
			'<div>Username: <input type="text" class="username" maxlength="16" required autofocus /></div>' +
			'<a href="#" class="start-game">Start game</a>');
		$('#game-content').on("click",".start-game", function() {
			var username = $(".username").val();
			username = username.replace(/\[|\]|<|>|\/|\\|\{|\}|\s|\(|\)/g, '');
			if (username.length < 3 || username.length > 16) {
				username = "User";
				alert('Invalid username');
				return;
			}
			if (confirm('Use this as your username: ' + username)) {
				Game.user = username;
				$(".username-text").html(Game.user);
				Game.saveGame();
				Game.UI.show_gameLoaded();
			}
		});
	},
	show_game: function() {
		this.clearAll();
		$("#game-content").append('<canvas id="game-canvas" width="'+stageWidth+'" height="'+stageHeight+'"></canvas>');
		$("body").on("mousedown mousemove", handleMouseDown);
		stage = new createjs.Stage(canvasName);
		stage.addChild(Game.greensContainer);
		stage.addChild(Game.redsContainer);
		stage.addChild(Game.dot.shape);
		stage.addChild(Game.dot.shotContainer);
	},
	show_gameover: function() {
		this.clearAll();
		$("#game-content").append(
			'<h2>Game Over</h2>' + 
			'<a href="#"  class="restart-game">Restart</a>' +
			'<div>' +
			'<p class="score"></p>' + 
			'<p class="legacy-score"></p>' +
			'<p class="dot-level"></p>' +
			'<p class="game-money"></p>' +
			'<p class="total-restarts"></p>' +
			'</div>');
		$(".score").html("Score: " + Game.score);
		$(".legacy-score").html("Legacy score: " + Game.totalScore);
		$(".dot-level").html("Level: " + Game.dot.lvl + " (" + Game.dot.xp + "/" + Game.xpTable[Game.dot.lvl] + ")");
		$(".game-money").html("Money: &#36;" + Game.money);
		$(".total-restarts").html("Restarts: " + Game.restarts);
		$("#game-content").on("click", ".restart-game", function() {
			Game.UI.show_gameLoaded();
		});
	},
	show_lvlComplete: function() {
		this.clearAll();
		$("#game-content").append(
			'<h2 class="level-complete"></h2>' +
			'<a href="#" class="next-level"></a>' +
			'<div>' +
			'<p class="score"></p>' + 
			'<p class="legacy-score"></p>' +
			'<p class="dot-level"></p>' +
			'<p class="game-money"></p>' +
			'<p class="total-restarts"></p>' +
			(Game.lvl != 1 ? '<a href="#" class="start-stage1">Restart from stage 1</a>' : '') +
			'</div>');
		$(".level-complete").html("Stage " + (Game.lvl-1) + " Complete");
		$(".next-level").html("Begin stage " + Game.lvl);
		$(".score").html("Score: " + Game.score);
		$(".legacy-score").html("Legacy score: " + Game.totalScore);
		$(".dot-level").html("Level: " + Game.dot.lvl + " (" + Game.dot.xp + "/" + Game.xpTable[Game.dot.lvl] + ")");
		$(".game-money").html("Money: &#36;" + Game.money);
		$(".total-restarts").html("Restarts: " + Game.restarts);
		$("#game-content").on("click", ".next-level", function() {
			Game.initLvl();
		});
		$("#game-content").on("click", ".start-stage1", function() {
			if (confirm("Restart from stage 1?")) {
				Game.gameOver(true);
			}
		});
	},
	show_gameLoaded: function() {
		this.clearAll();
		$("#game-content").append(
			'<h2 class="current-level"></h2>' +
			'<a href="#" class="begin-level">Begin</a>' +
			'<div>' +
			'<p class="score"></p>' + 
			'<p class="legacy-score"></p>' +
			'<p class="dot-level"></p>' +
			'<p class="game-money"></p>' +
			'<p class="total-restarts"></p>' +
			(Game.lvl != 1 ? '<a href="#" class="start-stage1">Restart from stage 1</a>' : '') +
			'</div>');
		$(".current-level").html("Current stage " + (Game.lvl));
		$(".score").html("Score: " + Game.score);
		$(".legacy-score").html("Legacy score: " + Game.totalScore);
		$(".dot-level").html("Level: " + Game.dot.lvl + " (" + Game.dot.xp + "/" + Game.xpTable[Game.dot.lvl] + ")");
		$(".game-money").html("Money: &#36;" + Game.money);
		$(".total-restarts").html("Restarts: " + Game.restarts);
		$("#game-content").on("click", ".begin-level", function() {
			Game.initLvl();
		});
		$("#game-content").on("click", ".start-stage1", function() {
			if (confirm("Restart from stage 1?")) {
				Game.gameOver(true);
			}
		});
	},
	
	show_main: function() {
		if (Game.play || Game.pause === true) {
			return false;
		}
		if (Game.pause) {
			$("#game-content").html('<canvas id="game-canvas" width="'+stageWidth+'" height="'+stageHeight+'"></canvas>');
			//$("#game-content").show();
		} else {		
			this.clearAll();
			if (Game.gameLoaded) {
				this.show_gameLoaded();
			} else {
				this.show_start();
			}
		}
	},
	
	show_page: function(content) {
		if (Game.play || Game.pause === true /*|| Game.user == ""*/) {
			return false;
		}
		this.clearAll();
		$("#game-content").append(content);
	},
	
	show_stats: function() {
		if (Game.play || Game.pause === true /* || Game.user == ""*/) {
			return false;
		}
		this.clearAll();
		$("#game-content").append(
			'<h2>Stats</h2>' + 
			'<p>Total money earned: <span class="stats-total-money-earned"></span></p>' +
			'<p>Total shots fired: <span class="stats-total-shots-fired"></span></p>' +
			'<p>Total shots hit: <span class="stats-total-shots-hit"></span></p>' +
			'<p>Total greens: <span class="stats-total-greens"></span></p>' +
			'<p>Total reds killed: <span class="stats-total-reds-killed"></span></p>' +
			'<p>Total reds : <span class="stats-total-reds"></span></p>' +
			'<p>Total Boss kills: <span class="stats-total-boss-kills"></span></p>' +
			'<p>Total deaths by boss: <span class="stats-total-deaths-by-boss"></span></p>' +
			'<p>Total damage taken: <span class="stats-total-damage-taken"></span></p>' +
			'<p>Total stages completed: <span class="stats-total-stages-completed"></span></p>' +
			'<p>Restarts: <span class="stats-restarts"></span></p>');
		$(".stats-total-money-earned").html("&#36;" + Game.stats.totalMoney);
		$(".stats-total-shots-fired").html(Game.stats.totalShotsFired);
		$(".stats-total-shots-hit").html(Game.stats.totalShotsHit + (Game.user && Game.stats.totalShotsFired > 0 ? " (acc: "+ (Math.round((Game.stats.totalShotsHit / Game.stats.totalShotsFired) * 10000)/100) + "&#37;" +")" : 0));
		$(".stats-total-greens").html(Game.stats.totalGreens);
		$(".stats-total-reds").html(Game.stats.totalRedsHit);
		$(".stats-total-reds-killed").html(Game.stats.totalRedsKilled);
		$(".stats-total-boss-kills").html(Game.stats.totalBossKills);
		$(".stats-total-deaths-by-boss").html(Game.stats.totalDeathsByBoss);
		$(".stats-total-damage-taken").html(Game.stats.totalDamageTaken);
		$(".stats-total-stages-completed").html(Game.stats.totalLvlsComplete);
		$(".stats-restarts").html(Game.restarts);
	},
	
	show_achievements: function() {
		if (Game.play || Game.pause === true /* || Game.user == ""*/) {
			return false;
		}
		this.clearAll();
		$("#game-content").append(
			'<h2>Achievements</h2>' +
			'<p>Total points: ' + Game.ach.points + '/' + Game.ach.totalPoints + '</p>' +
			'<div><ul class="achievement-list"></ul></div>');
		var ulElement = $(".achievement-list");
		
		for (a in Game.ach.list) {
			b = Game.ach.list[a];
			ulElement.append('<li><div class="achievement' +
				(b.complete === true ? ' complete"' : ' incomplete"') + '>' +
				'<div class="a-p">' + b.points + '</div>' +
				'<h3>' + b.fullname + '</h3>' +
				'<p>' + b.description + '</p>' + 
				'<p>Progress: ' + b.progress + '/' + b.progressComplete + '</p>' +
				'</div></li>');
		}
	},
	
	show_multiplayer: function() {
		if (Game.play || Game.pause === true || Game.user == "") {
			return false;
		}
		Game.saveGame();
		this.clearAll();
		Game.multiplayer = true;
		$("#game-content").append(
			'<h2>Multiplayer</h2>' +
			'<p class="mp_message"></p>' +
			'<p>Connect to server:</p>' +
			'<form method="post" id="connect_to_server">' +
			'<div><input type="text" id="ip_address" placeholder="ipaddress:port" value="' + Game.MP.ip + '" required autofocus /></div>' +
			'<div><input type="text" id="secret_key" placeholder="Secret key" value="' + Game.MP.secret + '" /></div>' +
			'<div><input type="submit" value="Connect" /><label for="reconnect">Reconnect</label> <input type="checkbox" id="reconnect" /></div>' +
			'</form>'
		);
		$("#connect_to_server").submit(function(e) {
			//$(this).attr('disabled');
			//Game.MP.reconnect = $("#reconnect").is(':checked');
			e.preventDefault();
			Game.MP.connection.connect();
		});
		$(".game-link").on('click', function(e) {
			Game.MP.connection.disconnect();
			Game.multiplayer = false;
		});
	},
	show_multiplayerLobby: function() {
		this.clearAll();
		$("#game-content").append(
			'<p>Connected players:</p>' + 
			'<div id="connected-players"></div>' +
			'<h2>Multiplayer Lobby</h2>' + 
			'<p>You are connected to <strong>' + Game.MP.connection.socket.io.opts.host + ':' + Game.MP.connection.socket.io.opts.port + '</strong></p>' + 
			'<div id="mp_lobby_chat">' +
			'<div id="mp_lobby_chat_main"></div>' +
			'<div id="mp_lobby_chat_input">' +
			'<form id="mp_lobby_chat_input_form">' +
			'<input type="text" placeholder="Type message here" id="mp_lobby_chat_input_form_message" required autofocus />' +
			'<input type="submit" value="Send" />' +
			'</form>' +
			'</div>' +
			'</div>' + 
				(Game.MP.admin ? 
					'<div>' +
					'<h4>You are admin</h4>' +
					'<div id="admin-control">' +
					'<form id="admin-control-form">' +
					'<select id="server-gamemode"><option value="0">PVP - Free For All</option><option value="1">PVP - Teams (Coming soon)</option><option value="2">CO-OP</option></select>' +
					'<input type="submit" value="Start Game" disabled />' +
					'</form>' +
					'</div>' + 		// END #admin-control
					'</div>'
				: '')
		);
		$("#admin-control-form").submit(function(e) {
			e.preventDefault();
			alert("Coming soon...");
		});
		$("#mp_lobby_chat_input_form").submit(function(e) {
			e.preventDefault();
			$(".mp_lobby_chat_pending_send").remove();
			var content = $("#mp_lobby_chat_input_form input[type=text]#mp_lobby_chat_input_form_message").val();
			$("#mp_lobby_chat_input_form input[type=text]#mp_lobby_chat_input_form_message").val("");
			if (content.length == 0) {
				alert("Enter a message");
				return;
			}
			if (content[0] == '/') {
				if (content.length < 3) {
					return;
				}
				content = content.substr(1, content.length-1);
				console.log('Sending command to server: ' + content);
				Game.MP.connection.socket.emit('new-command', JSON.stringify({
					content: content
				}));
			} else {
				Game.MP.connection.socket.emit('lobby-new-message', JSON.stringify({
					content: content
				}));
				$("#mp_lobby_chat").prepend(
					'<div class="mp_lobby_chat_status_msg">Sending...</div>'
				);
				$(".mp_lobby_chat_status_msg").fadeOut(500, function(){
					$(this).remove();
				});
			}
		});
	},
	show_multiplayerGame: function() {
		this.clearAll();
		$("body").on("mousedown mousemove", handleMouseDown);
	},
	
	updateText: function() {
		$(".version-text").html("v."+Game.version);
		$(".username-text").html(unescape(Game.user));
		$(".hp-text").html(Game.dot.hp/* + "/" + Game.dot.maxHP*/);
		$(".score-text").html(Game.score);
		//$(".combo-text").html(Math.round( Game.combo * 10) / 10);
		$(".fps-text").html(Math.round( (1000/Game.timeDiff) * 10) / 10);
		$(".stage-text").html(Game.lvl);
		$(".stagetime-text").html(Math.round(Game.lvlTime/100)/10);
		$(".lvl-text").html(Game.dot.lvl);
		if (Game.play) {
			setTimeout(Game.UI.updateText, Game.UI.textUpdateDelay);
		}
	},
	
	show_combatText: function(content, type, target) {
		var color = type == 'dmg' ? "#ee5555" : "#33ff33";
		var text = new createjs.Text(content, "Bold 16px Helvetica", color);
		if (stage) {
			text.x = target.x;
			text.y = target.y - 10;
			stage.addChild(text);
			Game.UI.combatTextTimeout.push(setTimeout(function() {
				stage.removeChild(text);
				text = null;
				console.log("Test");
			}, 500));
		}
	},
	
	show_popup: function(popupContent) {
		var popupHTML = 
			'<div id="popup-background"></div>' +
			'<div id="popup-window">' +
			'<div id="popup-close">x</div>' +
			'<div id="popup-content"></div>' +
			//'</div>' +
			'</div>';
		$("body").append(popupHTML);
		$("#popup-content").html(popupContent);
		$("#popup-close").on("click", function() {
			$("#popup-background").remove();
			$("#popup-window").remove();
		});
	},
	
	show_notification: function(content) {
		$("#notifications").prepend(
			'<div class="notification"> ' + 
			content + 
			'</div>');
		var not = $(".notification:first-child");
		var num = $(".notification").length;
		not.css({
			'top': 90 - 20 * num,
			'opacity': 1,
			'width': 500 - 6 * num,
			'margin-left': -250 + 3 * num
		});
		
		this.notTimeout.push(setTimeout(function() {
			Game.UI.hide_notification(not);
		}, 1000 + 1500 * num));
		$(not).on("click", function() {
			Game.UI.hide_notification(this);
		});
	},
	
	hide_notification: function(e) {
		var cssTop = 0;
		var cssNewTop = 0;
		var notIndex = "";
		
		var num = $(".notification").length;
		$(".notification").each(function(index) {
			if ($(this).is($(e)) || num == 1) {
				notIndex = Game.UI.notTimeout.length-1 - index;
				return false;
			}
			$(this).css({
				'top': '+=20',
				'width': '+=6',
				'margin-left': '-=3'
			});
		});
		clearTimeout(Game.UI.notTimeout[notIndex]);
		Game.UI.notTimeout.pop(notIndex, 1);
		
		setTimeout(function() {
			$(e).remove();
		}, 150);
		$(e).css({
			'top': parseInt($(e).css("top")) + 35,
			'opacity': 0
		});
	},
		
	shop_startPage:
		'<h2>Shop</h2>',
	
	afkfarm_startPage: 
		'<h2>AFK Farm</h2>',
	
	options_startPage:
		'<h2>Options</h2'
		
}