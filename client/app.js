function main(){
    function renderRoute(){
        var address = window.location.hash;
        var pageView = document.querySelector("#page-view");
        emptyDOM(pageView);  
        var lobby = new Lobby();
        var lobbyView = new LobbyView(lobby);
        var chatView = new ChatView();
        var profileView = new ProfileView();
        if(address == ""){
            pageView.appendChild(lobbyView.elem);
        }
        else if(address == "#/chat"){
            pageView.appendChild(chatView.elem);            
        }
        else if(address == "#/profile"){
            pageView.appendChild(profileView.elem);                
        }
    }
    window.addEventListener('popstate', renderRoute);
    renderRoute();
}

window.addEventListener('load', main);

class LobbyView{
    constructor(lobby){
        this.lobby = lobby;
        var contentElem = createDOM(`<div class = "content">
        <ul class = "room-list">
          <li>
            <a href = "#/chat">
              Rachel
            </a>
          </li>
          <li>
            <a href = "#/chat">
              Christy
            </a>
          </li>
          <li>
            <a href = "#/chat">
              Jane
            </a>
          </li>
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
                this.lobby.addRoom(id, newRoomName);
                this.inputElem.value = "";
            }
        });
        this.lobby.onNewRoom = (room) => {
            var a = document.createElement('a');
                var linkText = document.createTextNode(room.name);
                a.appendChild(linkText);
                a.href = "#/chat";
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
                a.href = "#/chat";
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
        this.elem = contentElem;
        this.titleElem = this.elem.querySelector("h4");
        this.chatElem = this.elem.querySelector(".message-list");
        this.inputElem = this.elem.querySelector("textarea");
        this.buttonElem = this.elem.querySelector("button")
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
    constructor(id, name, image = "assets/everyone-icon.png", message = []){
        this.id = id;
        this.name = name;
        this.image = image;
        this.message = message;
    }
    addMessage(username, text){
        if(text.trim()){    
            var message = {username: username, text: text};
            this.message.push(message);
        }
    }
}

class Lobby{
    constructor(){
        var room1 = new Room(1, "Rachel");
        var room2 = new Room(2, "Christy");
        var room3 = new Room(3, "Jane");
        var room4 = new Room(4, "Charles");
        this.rooms = new Object();
        this.rooms[room1.id] = room1;
        this.rooms[room2.id] = room2;
        this.rooms[room3.id] = room3;
        this.rooms[room4.id] = room4;
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