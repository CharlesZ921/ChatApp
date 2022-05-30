//global variables
profile = new Object();
profile.username = "Coder";
Service = new Object();
Service.origin = window.location.origin;
Service.getAllRooms = function(){
    return new Promise((resolve, reject) => {
        try{
            var request = new XMLHttpRequest();
            request.open("GET", Service.origin + "/chat");
            request.onreadystatechange = function(){
                if(request.readyState == 4){
                    if(request.status == 200){
                        resolve(JSON.parse(request.response));
                    }
                    else{
                        reject(new Error(request.response));
                    }
                }
            };
            request.send();
        }
        catch(err){
            reject(err);
            console.log("client-side error");
        }
    });
};
Service.addRoom = function(data){
    return new Promise((resolve, reject) => {
        var request = new XMLHttpRequest();
        request.open("POST", Service.origin + "/chat");
        request.setRequestHeader("Content-Type", "application/json");
        request.onreadystatechange = function(){
            if(request.readyState == 4){
                if(request.status == 200){
                    console.log(request.response);
                    resolve(JSON.parse(request.response));
                }
                else{
                    reject(new Error(request.response));
                    console.log("promise rejected at add room");
                }
            }
        };
        console.log(data);
        console.log(JSON.stringify(data));
        request.send(JSON.stringify(data));
    });
}

function main(){
    var lobby = new Lobby();
    var lobbyView = new LobbyView(lobby);
    var chatView = new ChatView();
    var profileView = new ProfileView();
    function renderRoute(){
        var address = window.location.hash;
        var pageView = document.querySelector("#page-view");
        emptyDOM(pageView);  
        if(address == "" || address == "#/"){
            pageView.appendChild(lobbyView.elem);
        }
        else if(address.substring(0, 6) == "#/chat"){
            pageView.appendChild(chatView.elem);
            var curRoom = lobby.getRoom(address.substring(7, address.length));
            if(curRoom != null){   
                chatView.setRoom(curRoom);
            }
        }
        else if(address == "#/profile"){
            pageView.appendChild(profileView.elem);                
        }
    }
    function refreshLobby(){
        Service.getAllRooms().then((resolve) => {
            for(var i = 0; i < resolve.length; i++){
                var curRoom = lobby.getRoom(resolve[i].id)
                if(curRoom == null){
                    lobby.addRoom(resolve[i].id, resolve[i].name, resolve[i].image, resolve[i].messages);
                }
                else{
                    curRoom.name = resolve[i].name;
                    curRoom.image = resolve[i].image;
                }
            }
        });
    }
    refreshLobby();
    window.addEventListener('popstate', renderRoute);
    renderRoute();
    setInterval(refreshLobby, 5000);
}

window.addEventListener('load', main);

class LobbyView{
    constructor(lobby){
        this.lobby = lobby;
        var contentElem = createDOM(`<div class = "content">
        <ul class = "room-list">
        </ul>
        <div class = "page-control">
          <input type = text>
          <button>Create Room</button>
        </div>
      </div>`);
        this.elem = contentElem;
        this.listElem = this.elem.querySelector(".room-list");
        this.inputElem = this.elem.querySelector("input");
        this.buttonElem = this.elem.querySelector("button");
        this.redrawList();
        this.buttonElem.addEventListener('click', () => {
            var newRoomName = this.inputElem.value;
            if(newRoomName.trim()){
                //allocate an unusing id
                var id = 0;
                for(var i = 1; i < Number.MAX_SAFE_INTEGER; i++){
                    if(this.lobby.getRoom(i) == undefined){
                        id = i;
                        break;
                    }
                }
                var data = new Object();
                data.name = newRoomName;
                data.image = "assets/everyone-icon.png";
                Service.addRoom(data).then((resolve) => this.lobby.addRoom(resolve.id, resolve.name, resolve.image));
                this.inputElem.value = "";
            }
        });
        this.lobby.onNewRoom = (room) => {
            var a = document.createElement('a');
                var linkText = document.createTextNode(room.name);
                a.appendChild(linkText);
                a.href = "#/chat/" + room.id;
                var li = document.createElement('li');
                li.appendChild(a);
                this.listElem.appendChild(li);
        }
    }
    redrawList(){
        emptyDOM(this.listElem);
        for (var roomId in this.lobby.rooms){
            if(this.lobby.rooms.hasOwnProperty(roomId)){
                var room = this.lobby.rooms[roomId];
                var a = document.createElement('a');
                var linkText = document.createTextNode(room.name);
                a.appendChild(linkText);
                a.href = "#/chat/" + roomId;
                var li = document.createElement('li');
                li.appendChild(a);
                this.listElem.appendChild(li);
            }
        }
    }
}

class ChatView{
    constructor(){
        var contentElem = createDOM(`<div class = "content">
        <h4 class = "room-name">
            Rachel
        </h4>
        <div class = "message-list">
            <div class = "message">
                <span class = "message-user">
                    Rachel:
                </span>
                <span class = "message-text">
                    message
                </span>
            </div>
            <div class = "message my-message">
                <span class = "message-user">
                    Me:
                </span>
                <span class = "message-text">
                    message
                </span>
            </div>
        </div>
        <div class = page-control>
            <textarea></textarea>
            <button>Send</button>
        </div>
    </div>`);
        this.room = null;
        this.elem = contentElem;
        this.titleElem = this.elem.querySelector("h4");
        this.chatElem = this.elem.querySelector(".message-list");
        this.inputElem = this.elem.querySelector("textarea");
        this.buttonElem = this.elem.querySelector("button")
        this.buttonElem.addEventListener('click', () => {this.sendMessage()});
        this.inputElem.addEventListener('keyup', (event) => {
            if(event.keyCode == 13){
                this.sendMessage();
            }
        });
    }
    sendMessage(){
        var newMessage = this.inputElem.value;
        this.room.addMessage(profile.username, newMessage);
        this.inputElem.value = "";
    }
    setRoom(room){
        this.room = room;
        emptyDOM(this.titleElem);
        this.titleElem.appendChild(document.createTextNode(room.name));
        emptyDOM(this.chatElem);
        for(var i = 0; i < this.room.messages.length; i++){
            var spanUser = document.createElement("span");
            spanUser.classList.add("message-user");
            spanUser.appendChild(document.createTextNode(this.room.messages[i].username + ": "));
            var spanText = document.createElement("span");
            spanText.classList.add("message-text");
            spanText.appendChild(document.createTextNode(this.room.messages[i].text)); 
            var box = document.createElement("div");
            box.classList.add("message");
            box.appendChild(spanUser);
            box.appendChild(spanText);
            if(this.room.messages[i].username == profile.username){
                box.classList.add("my-message");
            }
            this.chatElem.appendChild(box);
        }
        this.room.onNewMessage = (message) => {
            var spanUser = document.createElement("span");
            spanUser.classList.add("message-user");
            spanUser.appendChild(document.createTextNode(message.username + ": "));
            var spanText = document.createElement("span");
            spanText.classList.add("message-text");
            spanText.appendChild(document.createTextNode(message.text)); 
            var box = document.createElement("div");
            box.classList.add("message");
            box.appendChild(spanUser);
            box.appendChild(spanText);
            if(message.username == profile.username){
                box.classList.add("my-message");
            }
            this.chatElem.appendChild(box);
        }
    }
}

class ProfileView{
    constructor(){
        var contentElem = createDOM(`<div id = "content">
        <div class = "profile-form">
            <div class = "form-field">
                <label>Username</label>
                <input type = text>
            </div>
            <div class = "form-field">
                <label>Password</label>
                <input type = password>
            </div>
            <div class = "form-field">
                <label>Avatar Image</label>
                <input type = file>
            </div>
        </div>
        <div class = "page-control">
            <button>Save</button>
        </div>
    </div>`);
        this.elem = contentElem;
    }
}

class Room{
    constructor(id, name, image = "assets/everyone-icon.png", messages = []){
        this.id = id;
        this.name = name;
        this.image = image;
        this.messages = messages;
    }
    addMessage(username, text){
        if(text.trim()){    
            var message = {username: username, text: text};
            this.messages.push(message);
            if(this.onNewMessage != undefined){
                this.onNewMessage(message);
            }
        }
    }
}

class Lobby{
    constructor(){
        this.rooms = new Object();
    }
    getRoom(roomId){
        return this.rooms[roomId];
    }
    addRoom(id, name, image, messages){
        var newRoom = new Room(id, name, image, messages);
        this.rooms[id] = newRoom;
        if(this.onNewRoom != undefined){
            this.onNewRoom(newRoom);
        }
    }
}



// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM (elem){
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM (htmlString){
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}

// example usage
var messageBox = createDOM(
    `<div>
        <span>Alice</span>
        <span>Hello World</span>
    </div>`
    );