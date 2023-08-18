import http from "http";
import express from "express";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";


const app = express();

app.set('view engine', "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"))

app.get("/", (_, res) => res.render("home"));
// 홈 url외에 다른 url로 호출이 왔을 경우 home으로 리다이렉트 시킴
app.get("/*", (_, res) => res.redirect("/"));


// 같은 서버에 http , ws 둘다 기동하는 방법
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

instrument(io, {
    auth: false
});


io.on("connection", (socket) => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    })
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);