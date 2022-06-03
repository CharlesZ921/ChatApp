const { MongoClient, ObjectID } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v3.6+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.6/api/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = function(){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
            var collection = db.collection("chatrooms");
            collection.find({}).toArray(function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
		})
	)
}

Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
            let id;
            try {
                id = ObjectId(room_id);
            } catch (err) {
                id = room_id;
            }
            var query = { _id: id };
            var collection = db.collection("chatrooms");
            collection.find(query).toArray(function (err, result) {
                if (err) reject(err);
                else if (result.length == 0) {
                    resolve(null);
                } else {
                    resolve(result[0]);
                }
            });
		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
            if(room["name"] == null){
                reject(new Error("name not found"));
            }
            else{
                var collection = db.collection("chatrooms");
                collection.insertOne(room, (err, result) => {
                    if(err){
                        reject(err);
                    }
                    var retRoom = new Object();
                    retRoom._id = room["_id"];
                    retRoom.name = room.name
                    retRoom.image = room.image;
                    resolve(retRoom);
                });
            }
		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
            var time = parseInt(before);
            if(before == null){
                time = Date.now();
            }
            
            var query = { $and: [{ room_id: room_id }, { timestamp: { $lt: time } }] };
            var sort = { timestamp : -1 };
            var collection = db.collection("conversations");
            collection.find(query).sort(sort).toArray(function (err, result) {
                if (err){
                    reject(err);
                }
                else if (result.length == 0) {
                    console.log("this is null");
                    resolve(null);
                } else {
                    console.log(result[0]);
                    resolve(result[0]);
                }
            });
		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			if(conversation.room_id == null || conversation.timestamp == null || conversation.messages == null){
                reject(new Error("field missing"));
            }
            var collection = db.collection("conversations");
            collection.insertOne(conversation, (err, result) => {
                if(err){
                    reject(err);
                }
                resolve(result);
            });
		})
	)
}

module.exports = Database;