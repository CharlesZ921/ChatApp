const WS = require('ws');
const path = require('path');
const fs = require('fs');
const express = require('express');
const ms = require('./Database.js');
const { resolve } = require('path');
const sm = require('./SessionManager.js');

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');
const messageBlockSize = 5;

// Session Manager
var SessionManager = new sm();

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
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
				sessionManager.createSession(res, username);
				res.redirect('/');
			}
			else {
				res.redirect('/login');
			}
		}
	});
});

function isCorrectPassword(password, saltedHash){
	var salt = saltedHash.subString(0, 20);
	var base64 = saltedHash.subString(20);
	return (base64 == crypto.createHash('sha256').update(password + salt).digest("base64"));
}



const wss = new WS.WebSocketServer({ port: 8000 });

wss.on('connection', function connection(ws) {
	ws.on('message', function message(data) {
		wss.clients.forEach(function each(client) {
			if (client !== ws && client.readyState === WS.WebSocket.OPEN) {		  
				client.send(JSON.stringify(JSON.parse(data)));
			}
		});
		var messageObj = JSON.parse(data);
		var newText = new Object();
		newText.username = messageObj.username;
		newText.text = messageObj.text;
		messages[messageObj.roomId].push(newText);
		if(messages[messageObj.roomId].length == messageBlockSize){
			console.log("reach 5");
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


