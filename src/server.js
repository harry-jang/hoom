import http from "http";
import express from "express";
import SocketIO from "socket.io";

const app = express();

app.set('view engine', "pug");
app.set("views", __dirname + "/views" );
app.use("/public", express.static(__dirname + "/public"))

app.get("/", (_, res) => res.render("home"));
// 홈 url외에 다른 url로 호출이 왔을 경우 home으로 리다이렉트 시킴
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);


// 같은 서버에 http , ws 둘다 기동하는 방법
const httpServer = http.createServer(app);
const io = SocketIO(httpServer);

io.on("connection", (socket) => {
    socket.onAny((event) => {console.log(`Socket Event : ${event}`)})
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome");
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye"));
    });

    socket.on("chat_message", (msg, room, done) => {
        socket.to(room).emit("chat_message", msg);
        done();
    })
});

httpServer.listen(3000, handleListen);