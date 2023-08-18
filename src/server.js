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

const handleListen = () => console.log(`Listening on http://localhost:3000`);


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

function publicRooms() {
    const {
        sockets: {
            adapter: { sids, rooms },
        }
    } = io;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });

    return publicRooms;
}

function countRommMember(roomName) {
    return io.sockets.adapter.rooms.get(roomName)?.size;
}

io.on("connection", (socket) => {
    socket["nickname"] = "익명";
    socket.onAny((event) => {
        console.log(io.sockets.adapter)
        console.log(`Socket Event : ${event}`)
    });
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);
        done(countRommMember(roomName));
        socket.to(roomName).emit("welcome", socket.nickname, countRommMember(roomName));
        io.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname, countRommMember(room) - 1));
    });

    socket.on("disconnect", () => {
        io.sockets.emit("room_change", publicRooms());
    });

    socket.on("chat_message", (msg, room, done) => {
        socket.to(room).emit("chat_message", `${socket.nickname}: ${msg}`);
        done();
    })

    socket.on("nickname", nickname => (socket["nickname"] = nickname));
});

httpServer.listen(3000, handleListen);