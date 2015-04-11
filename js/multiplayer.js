Game.MP = {
	ip: "127.0.0.1:8080",
	secret: "secret",
	UID: "",
	admin: false,
	serverStatus: null,
	users: {},
	reconnect: false,
	reconnectAttempt: 0,
	
	// multiplayer containers and stuff
	dotContainer: null,
	greenContainer: null,
	redContainer: null,
	shotContainer: null,
	
	lastMouseX: null,
	lastMouseY: null,
	
	shots: [],
	reds: [],
	greens: []
}

Game.MP.d = {
	ping: 0
}

Game.MP.reconnectFunction = function(secret, ip) {
	if (Game.multiplayer && (Game.MP.reconnect || $("#reconnect").is(':checked')) && !Game.MP.connection.connected) {
		Game.MP.reconnectAttempt++;
		console.log('Attempting reconnect... (' + Game.MP.reconnectAttempt + ')');
		Game.MP.connection.connect(secret, ip);
	} else {
		console.log('Reconnecion aborted');
	}
}

Game.MP.connection = {
	socket: undefined,
	connectTimeout: "",
	cmdrate: 100,
	
	connect: function(secret, ip) {
		if (this.socket) {
			this.socket.disconnect();
		}
		//Game.MP.reconnect = $("#reconnect").is(':checked');
		var secret = secret || $("#secret_key").val();
		var ip = ip || $("#ip_address").val();
		Game.MP.ip = ip;
		Game.MP.secret = secret;
		//ip = 'localhost:8080';
		//secret = 'secret';
		if (ip == "") {
			alert('Enter an IP address');
			return false;
		}
		this.socket = new io.connect('http://' + ip, {
			forceNew: true,
			query: $.param({token: secret}),
			reconnection: false,
			timeout: 4000
		});
		var mp_e = $(".mp_message");
		mp_e.html('Connecting to ' + ip + '...');
		console.log('Connecting to ' + ip + '...');
		
		this.socket.on('connect', function() {
			Game.MP.reconnect = false;
			clearInterval(Game.MP.reconnectInterval);
			console.log('Connected to the server!');
			Game.MP.connection.socket.emit('verify-version', JSON.stringify({v:Game.version}));
		});
		
		this.socket.on('accept-user', function(data) {
			data = JSON.parse(data);
			console.log('Accepted');
			Game.MP.UID = data.UID;
			Game.MP.connection.socket.emit('set-username', JSON.stringify({
				username: Game.user
			}));
			setTimeout(Game.MP.connection.client_tick, 1000/Game.MP.connection.cmdrate);
		});
		
		this.socket.on('setadmin', function() {
			console.log('You are admin on the server');
			Game.MP.admin = true;
		});
		
		this.socket.on('change-username', function(data) {
			data = JSON.parse(data);
			$("#mp_lobby_player_id-"+data.userid+".mp_lobby_player .mp_lobby_player_username").html(data.username);
		});
		
		this.socket.on('lobby-new-message', function(data) {
			data = JSON.parse(data);
			var d = new Date();
			d.setTime(data.timestamp);
			if (data.content == '/ping') {
				this.d.ping = performance.now();
			}
			$("#mp_lobby_chat_main").prepend(
				'<div class="mp_lobby_chat_message">' +
				'<div class="mp_lobby_chat_message_timestamp">' + d.getHours() + ':'+d.getMinutes() + ':' + d.getSeconds() + '</div>' +
				'<div class="mp_lobby_chat_message_user"'+ (data.user.UID == Game.MP.UID ? ' style="font-weight:bold"':'') +'>' + unescape(data.user.name) + '[' + data.user.UID + ']</div>' +
				'<div class="mp_lobby_chat_message_content">' + unescape(data.content) + '</div>' +
				'</div>'
			);
		});
		this.socket.on('chat-timeout', function() {
			$(".mp_lobby_chat_status_msg").html('Timed out..');
		});
		this.socket.on('command-response', function(data) {
			data = JSON.parse(data);
			console.log(data);
			if (data.message) {
				var content = "";
				if (Array.isArray(data.message)) {
					for (l in data.message) {
						content += data.message[l];
					}
				} else {
					content = data.message;
				}
				if ( content == 'pong') {
					Game.MP.d.ping = performance.now() - Game.MP.d.ping;
					content = 'Ping: ' + (Game.MP.d.ping / 1000) + ' ms (pong?)';
				}
				var d = new Date();
				$("#mp_lobby_chat_main").prepend(
					'<div class="mp_lobby_chat_message_server">' +
					'<div class="mp_lobby_chat_message_timestamp">' + d.getHours() + ':'+d.getMinutes() + ':' + d.getSeconds() + '</div>' +
					'<div class="mp_lobby_chat_message_user">&lt;SERVER&gt;</div>' +
					'<div class="mp_lobby_chat_message_content">' + content + '</div>' +
					'</div>'
				);
			}
		});
		
		this.socket.on('admin-recieve-log', function(data) {
			var jData = JSON.parse(data);
			console.log(jData);
		});
		
		this.socket.on('server-status', function(data) {
			data = JSON.parse(data);
			Game.MP.serverStatus = data.status;
			if (Game.MP.serverStatus == 'lobby') {
				Game.MP.connection.cmdrate = 2;
				Game.UI.show_multiplayerLobby();
			} else if (Game.MP.serverStatus == 'game') {
				Game.MP.connection.cmdrate = 60;
			}
		});
		this.socket.on('server tick', function(data) {
			data = JSON.parse(data);
			if (Game.MP.serverStatus == 'game') {
				for (UID in data.UID) {
					if (Game.MP.users[UID]) {
						Game.MP.users[UID].dot.shape.x = data.UID.x;
						Game.MP.users[UID].dot.shape.y = data.UID.y;
						Game.MP.users[UID].dot.hp = data.UID.hp;
					} else {
						console.log('Unknown user: ' + UID);
					}
				}
				for (ent in data.ENTITIES) {
					
				}
			} else if (Game.MP.serverStatus == 'lobby') {
				for (UID in data.UID) {
					
				}
			}
		});

		this.socket.on('message', function(data) {
			data = JSON.parse(data);
			console.log('Recieved a message from the server!', data);
		});

		this.socket.on('userdisconnect', function(data) {
			data = JSON.parse(data);
			console.log('User ' + data.UID + ' disconnect');
			if (Game.MP.serverStatus == 'lobby') {
				$("#mp_lobby_player_id-"+data.UID+".mp_lobby_player").remove();
			}
		});
		
		this.socket.on('connected-users', function(data) {
			data = JSON.parse(data);
			var userlist = $("#connected-players");
			for (a in data) {
				Game.MP.users[a] = new Game.MP.Player(a);
				if (Game.MP.serverStatus == 'lobby') {
					userlist.append(
						'<div class="mp_lobby_player" id="mp_lobby_player_id-' + a + '"><span class="mp_lobby_player_username">' + data[a].name + '</span>[<span class="mp_lobby_player_id">'+a+'</span>]</div>'
					);
				}
			}
		});
		
		this.socket.on('newuser', function(data) {
			data = JSON.parse(data);
			if (data.UID == Game.MP.UID) {
				console.log('Duplicate UIDs');
				return;
			}
			if (Game.MP.serverStatus == 'lobby') {
				$("#connected-players").append(
					'<div class="mp_lobby_player" id="mp_lobby_player_id-' + data.UID + '"><span class="mp_lobby_player_username">undefined</span>[<span class="mp_lobby_player_id">'+data.UID+'</span>]</div>'
				);
			}
			console.log('User ' + data.UID + ' connected to the server');
		});
		
		this.socket.on('game-in-progress', function() {
			console.log('Game in progress on server');
		});
		
		this.socket.on('disconnect', function() {
			console.log('Disconnected from server (userid: '+Game.MP.UID+')');
			Game.UI.show_multiplayer();
			$(".mp_message").html('Disconnected from server');
			Game.MP.connection.reconnect();
		});
		// Connection failed shit..
		this.socket.on('connect_error', function(e) {
			mp_e.html('Connection error');
			console.log('Connection error');
			Game.MP.connection.reconnect();
		});
		this.socket.on('connect_timeout', function(e) {
			mp_e.html('Connection timed out');
			console.log('Connection timed out');
			Game.MP.connection.reconnect();
		});
		this.socket.on('error', function(e) {
			if (e == 'Unauthorized') {
				mp_e.html('Wrong secret key');
			} else {
				mp_e.html('Error');
			}
			console.log(e);
			Game.MP.connection.reconnect();
		});
	},
	
	reconnect: function() {
		if (Game.MP.reconnect === true || $("#reconnect").is(':checked')) {
			console.log('Reconnecting in 5 seconds');
			setTimeout(Game.MP.reconnectFunction, 5000);
		}
	},
	
	client_tick: function() {
		//var data = "";
		var data = {};
		if (Game.MP.connection.socket) {
			data.UID = Game.MP.UID;
			if (Game.MP.serverStatus == 'lobby') {
			
			} else if (Game.MP.serverStatus == 'game') {
				//var x = window.pageX;
				//var y = window.pageY;
				data.wDown = Game.wDown;
				data.aDown = Game.aDown;
				data.sDown = Game.sDown;
				data.dDown = Game.dDown;
				/*data.mouse = {
					x: window.pageX - canvas.offset().left,
					y: window.pageY - canvas.offset().top
				};*/
			}
			if (Game.MP.connection.socket.connected) {
				Game.MP.connection.socket.emit('client update', JSON.stringify(data));
				setTimeout(Game.MP.connection.client_tick, 1000/Game.MP.connection.cmdrate);
			}
		}
	},
	
	disconnect: function() {
		if (this.socket && this.socket.connected) {
			this.socket.disconnect();
			Game.UI.show_multiplayer();
		}
	},
}

Game.MP.Player = function(userid) {
	this.UID = userid;
	this.dot = new Game.Dot();
}
