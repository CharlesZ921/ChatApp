const WS = require('ws');
const path = require('path');
const fs = require('fs');
const express = require('express');
const ms = require('./Database.js');
const mm = require('./SessionManager.js');
const crypto = require('crypto');

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');
const messageBlockSize = 5;

// Session Manager
var sm = new mm();

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

//////////defined middleware
app.use('/chat/:room_id/messages', sm.middleware);
app.use('/chat/:room_id', sm.middleware);
app.use('/chat', sm.middleware);
app.use('/profile', sm.middleware);
app.use('/app.js', sm.middleware, express.static(clientApp + '/app.js'));
app.use('/index.html', sm.middleware, express.static(clientApp + '/index.html'));
app.use('/index', sm.middleware, express.static(clientApp + '/index.html'));
app.use('[/]', sm.middleware, express.static(clientApp + '/'));
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.use(sm.middlewareErrorHandler);

app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});


var db = new ms("mongodb://localhost:27017", "cpen322-messenger");

var messages = new Object();
db.getRooms().then((resolve) => {
	for(var i = 0; i < resolve.length; i++){
		messages[resolve[i]._id] = [];
	}
});


app.route("/chat/:room_id/messages").get((req, res) => {
	var id = req.params.room_id;
	var before = req.query.before;
	db.getLastConversation(id, before).then((resolve) => {
		res.status(200).send(JSON.stringify(resolve));
	});
});

app.route("/chat/:room_id").get((req, res) => {
	var id = req.params.room_id;
	db.getRooms(id).then((resolve) => {
		if(resolve == null){
			res.status(404).send("Room not found");
		}
		else{
			res.status(200).send(JSON.stringify(resolve));
		}
	});
});

app.route("/chat").get((req, res) => {
	db.getRooms().then((resolve) => {
		var returnRooms = [];
		for(var i = 0; i < resolve.length; i++){
			var retRoom = new Object();
			retRoom._id = resolve[i]._id;
			retRoom.name = resolve[i].name;
			retRoom.image = resolve[i].image;
			retRoom.messages = messages[resolve[i]._id];
			returnRooms.push(retRoom);
		}
		res.status(200).send(JSON.stringify(returnRooms));
	});
}).post((req, res) => {
	var receivedData = req.body;
	if(receivedData.name == null){
		res.status(400).send("the room has no name");
		return;
	}
	db.addRoom(receivedData).then((resolve) => {
	    messages[resolve._id] = [];
	    res.status(200).send(JSON.stringify(resolve));
	})
});

app.route("/login").post((req, res) => {
	var receivedData = req.body;
	db.getUser(receivedData.username).then((result) => {
		if(result == null){
			res.redirect('/login');
		}
		else{
			if (isCorrectPassword(receivedData.password, result.password)) {
				sm.createSession(res, receivedData.username);
				res.redirect('/');
			}
			else {
				res.redirect('/login');
			}
		}
	});
});

app.route("/profile").get((req, res) => {	
	var retObj = new Object();
	retObj.username = req.username;
	console.log(retObj.username);
	res.status(200).send(JSON.stringify(retObj));
});

function isCorrectPassword(password, saltedHash){
	var salt = saltedHash.substring(0, 20);
	var base64 = saltedHash.substring(20);
	return (base64 == crypto.createHash('sha256').update(password + salt).digest("base64"));
}



const wss = new WS.WebSocketServer({ port: 8000 });

wss.on('connection', function connection(ws, request) {
	var cookie = request.headers.cookie;
	if (cookie == null || sm.getUsername(cookie.split('=')[1]) == null) {
		broker.clients.forEach((client) => {
			if (client == ws && client.readyState === WebSocket.OPEN) {
				client.close();
			}
		});
	}
	ws.on('message', function message(data) {
		wss.clients.forEach(function each(client) {
			if (client !== ws && client.readyState === WS.WebSocket.OPEN) {		  
				client.send(JSON.stringify(JSON.parse(data)));
			}
		});
		var messageObj = JSON.parse(data);
		var newText = new Object();
		newText.username = sm.getUsername(cookie.split('=')[1])
		newText.text = messageObj.text;
		messages[messageObj.roomId].push(newText);
		if(messages[messageObj.roomId].length == messageBlockSize){
			var newConv = new Object();
			newConv.room_id = messageObj.roomId;
			newConv.timestamp = Date.now();
			newConv.messages = messages[messageObj.roomId];
			db.addConversation(newConv).then((resolve) => {
				if(resolve != null){
					messages[messageObj.roomId] = [];
				}
			});
		}
	});
});




