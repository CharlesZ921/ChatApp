function main(){
    function renderRoute(){
        var address = window.location.hash;
        var pageView = document.querySelector("#page-view");
        emptyDOM(pageView);
        var lobbyView = new LobbyView();
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
    constructor(){
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
        console.log(this.buttonElem.innerHTML);
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