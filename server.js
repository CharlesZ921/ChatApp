const WS = require('ws');
const path = require('path');
const fs = require('fs');
const express = require('express');
const ms = require('./Database.js');
const { resolve } = require('path');

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

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
		console.log(returnRooms)
		res.status(200).send(JSON.stringify(returnRooms));
	});
}).post((req, res) => {
	var receivedData = req.body;
	if(receivedData.name == null){
		res.status(400).send("the room has no name");
		return;
	}
	var room = new Object();
	var id = 0;
	loop1:
	for(var i = 1; i < Number.MAX_SAFE_INTEGER; i++){
		for(var j = 0; j < chatrooms.length; j++){
			if(chatrooms[j].id == i){
				continue loop1;
			}
		}
		id = i;
		break;
	}
	room.id = id;
	room.name = receivedData.name;
	room.image = receivedData.image;
	messages[id] = [];
	chatrooms.push(room);
	res.status(200).send(JSON.stringify(room));
});


const wss = new WS.WebSocketServer({ port: 8000 });

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WS.WebSocket.OPEN) {
        client.send(JSON.stringify(JSON.parse(data)));
		var messageObj = JSON.parse(data);
		var newText = new Object();
		newText.username = messageObj.username;
		newText.text = messageObj.text;
		messages[messageObj.roomId].push(newText);
      }
    });
  });
});


