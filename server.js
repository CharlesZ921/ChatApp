const path = require('path');
const fs = require('fs');
const express = require('express');

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

var chatrooms = [];
var sampleRoom = new Object;
sampleRoom.id = 1;
sampleRoom.name = "Skye";
sampleRoom.image = "assets/everyone-icon.png";
chatrooms.push(sampleRoom);

var messages = new Object;
messages[sampleRoom.id] = [];

app.route("/chat").get((req, res) => {
	res.status(200);
	var returnRooms = [];
	for(var i = 0; i < chatrooms.length; i++){
		var retRoom = new Object();
		retRoom.id = chatrooms[i].id;
		retRoom.name = chatrooms[i].name;
		retRoom.image = chatrooms[i].image;
		retRoom.messages = messages[chatrooms[i].id];
		returnRooms.push(retRoom);
	}
	res.send(JSON.stringify(returnRooms));
});