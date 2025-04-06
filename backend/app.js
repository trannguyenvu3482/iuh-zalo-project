const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cors = require("cors");
const initSupabase = require("./app/utils/initSupabase");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Initialize Supabase storage buckets
initSupabase().catch(err => {
  console.error("Failed to initialize Supabase storage:", err);
  console.warn("⚠️ File uploads may not work correctly. Check your Supabase configuration.");
});

// Configure CORS options from environment variables
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const corsOptions = { 
  origin: clientUrl, 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Setup Socket.IO with same CORS config
const io = socketIo(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Apply CORS for Express
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads folder (for backward compatibility)
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
require("./app/routes/message.routes")(app);

// Initialize Socket.IO for all controllers that need it
const { setIo: setMessageIo } = require("./app/controllers/message.controller");
const { setIo: setConversationIo } = require("./app/controllers/conversation.controller");
const { setIo: setFriendIo } = require("./app/controllers/friend.controller");

setMessageIo(io);
setConversationIo(io);
setFriendIo(io);

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

  socket.on("typing_start", ({ conversationId }) => {
    socket.to(`conversation_${conversationId}`).emit("user_typing", {
      userId: socket.userId,
      conversationId
    });
  });

  socket.on("typing_end", ({ conversationId }) => {
    socket.to(`conversation_${conversationId}`).emit("user_stopped_typing", {
      userId: socket.userId,
      conversationId
    });
  });

  socket.on("message_read", async ({ messageId, conversationId }) => {
    try {
      // Update message read status in database
      await messageService.markMessageAsRead(messageId, socket.userId);
      
      // Notify other users in the conversation
      socket.to(`conversation_${conversationId}`).emit("message_read_update", {
        messageId,
        userId: socket.userId
      });
    } catch (error) {
      socket.emit("error", { message: "Failed to mark message as read" });
    }
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

  socket.on("reconnect_attempt", () => {
    if (socket.userId) {
      db.ConversationMember.findAll({ where: { userId: socket.userId } })
        .then((members) => {
          members.forEach((m) => socket.join(`conversation_${m.conversationId}`));
        })
        .catch(error => {
          console.error("Reconnection error:", error);
        });
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";
  console.error(
    `[${req.method} ${req.url}] Error ${statusCode}: ${message}`,
    err.stack
  );
  res.status(statusCode).json({
    statusCode: 0, // Error indicator
    message,
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
