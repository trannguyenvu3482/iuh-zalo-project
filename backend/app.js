const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:8081",
    methods: ["GET", "POST"],
  },
});

const corsOptions = { origin: "http://localhost:8081" };
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads folder// Serve static files from uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const db = require("./app/models");
const Role = db.Role;

db.sequelize.sync().then(() => {
  console.log("Database synced");
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Zalo." });
});

require("./app/routes/auth.routes")(app);
require("./app/routes/friend.routes")(app);
require("./app/routes/user.routes")(app);
const { setIo } = require("./app/controllers/message.controller"); // Use one controller to set io
setIo(io);

io.on("connection", (socket) => {
  console.log("A user connected");
  const userId = socket.handshake.query.userId;
  if (userId) {
    db.ConversationMember.findAll({ where: { userId } }).then((members) => {
      members.forEach((m) => socket.join(`conversation_${m.conversationId}`));
    });
    socket.join(`user_${userId}`);
  }

  socket.on("joinQRRoom", (token) => {
    console.log("Client joining room:", token);
    socket.join(token);
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("friend_request", (data) => {
    console.log(`Friend request from ${data.from} to ${userId}`);
  });

  socket.on("friend_accepted", (data) => {
    console.log(`Friend accepted: ${data.from} and ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";
  console.error(
    `[${req.method} ${req.url}] Error ${statusCode}: ${message}`,
    err.stack
  );
  res.status(statusCode).json({
    status: err.status || "error",
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

// Initial roles
function initial() {
  Role.create({ name: "user" });
  Role.create({ name: "moderator" });
  Role.create({ name: "admin" });
}

// initial();
