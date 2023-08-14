import express from "express";

const app = express();

app.set('view engine', "pug");
app.set("views", __dirname + "/views" );
app.use("/public", express.static(__dirname + "/public"))

app.get("/", (req, res) => res.render("home"));

// 홈 url외에 다른 url로 호출이 왔을 경우 home으로 리다이렉트 시킴
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

app.listen(3000);