const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
call.hidden = true;
let myPeerConnection;


async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
 }

async function getMedia(deviceId) {

    const initialConstrains = {
        audio: true,
        video: { facingMode: "user" },
      }
    
    const cameraConstrains = {
        audio: true,
        video: {
            deviceId: {
              exact: deviceId,
            },
          },
      }

    try{
        myStream = await navigator.mediaDevices.getUserMedia(
           deviceId? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;

        if(!deviceId) {
            await getCameras();
        }
    } catch(e) {
        console.log(e)
    }
}

function handleMuteClick() {
    
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));

    if(!muted) {
        muteBtn.innerText = "Unmute"
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}
function handleCameraClick() {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));

    if(cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

async function handleCameraChange() {
    await getMedia(camerasSelect.value);

    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
        .getSenders()
        .find(sender => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome From (join a room)
const welcome = document.getElementById("welcome");
welcomeForm = welcome.querySelector("form");

async function initCall() {
    console.log("init call");
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function try_join_room(isSuccess, joinedRoomName) {
    console.log("isSuccess=", isSuccess);
    if(isSuccess) {
        roomName = joinedRoomName;
        await initCall();
        socket.emit("ready", roomName);
    } else {
        alert("정원이 초과되었습니다.");
    }
}
 
function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    socket.emit("join_room", input.value, try_join_room);

    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code
socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    console.log(answer);
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});

socket.on("answer", answer => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
})

// RTC Code
function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302"
                ],
            },   
        ],
    });

    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
        .getTracks()
        .forEach(track => myPeerConnection.addTrack(track, myStream));
    console.log(myStream.getTracks());
}

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
    
}

function handleAddStream(data) {
    const peerFace = document.getElementById("peerFace")
    console.log("Peer's Stream", data.stream);
    peerFace.srcObject = data.stream;
}