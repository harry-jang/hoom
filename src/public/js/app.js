const socket = io();

const welcome = document.getElementById("welcome");
const roomNameForm = welcome.querySelector("#room_name");
const nameForm = welcome.querySelector("#name");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");
    
    msgForm.addEventListener("submit", handleMessageSubmit)
}

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("chat_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";  
}

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = welcome.querySelector("#name input");
    socket.emit("nickname", input.value);
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = roomNameForm.querySelector("input");
    socket.emit("enter_room", input.value , showRoom);
    roomName = input.value;
    input.value  = "";
}


roomNameForm.addEventListener("submit" , handleRoomSubmit);
nameForm.addEventListener("submit", handleNicknameSubmit)

socket.on("welcome", (nickname) => {
    addMessage(`${nickname} joined!`);
})

socket.on("bye", (nickname) => {
    addMessage(`${nickname} leaved!`);
})

socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if(rooms.length === 0) {
        return;
    }

    
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});

// (msg) =>{addMessage(msg)} === addMessage
socket.on("chat_message", addMessage);

