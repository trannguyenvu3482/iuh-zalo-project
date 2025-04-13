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
initSupabase().catch((err) => {
  console.error("Failed to initialize Supabase storage:", err);
  console.warn(
    "⚠️ File uploads may not work correctly. Check your Supabase configuration."
  );
});

// Configure CORS options from environment variables
const clientUrls = process.env.CLIENT_URL || [
  "http://localhost:3000",
  "http://localhost:3001",
];
const corsOptions = {
  origin: clientUrls,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Setup Socket.IO with same CORS config
const io = socketIo(server, {
  cors: {
    origin: clientUrls,
    methods: ["GET", "POST"],
    credentials: true,
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
const messageService = require("./app/services/message.service");
const { setIo: setMessageIo } = require("./app/controllers/message.controller");
const {
  setIo: setConversationIo,
} = require("./app/controllers/conversation.controller");
const { setIo: setFriendIo } = require("./app/controllers/friend.controller");
const { setIo: setUserIo } = require("./app/controllers/user.controller");

// Import the call handlers
const { setupCallHandlers } = require("./socket/callHandlers");
// Import the user handlers
const { setupUserHandlers } = require("./socket/userHandlers");

// Import token routes
const tokenRoutes = require("./routes/tokenRoutes");

// Import the QR handlers
const { setupQRHandlers } = require("./socket/qrHandlers");
const { initializeSocketIO } = require("./app/services/auth.service");
const setupNgrok = require("./app/utils/setupNgrok");

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

// Use token routes for generating Agora tokens
app.use("/api/token", tokenRoutes);

// Initialize Socket.IO for all controllers that need it
setMessageIo(io);
setConversationIo(io);
setFriendIo(io);
setUserIo(io);
initializeSocketIO(io); // Initialize auth service with Socket.IO

io.on("connection", (socket) => {
  console.log("A user connected");
  setupQRHandlers(io, socket);

  socket.onAny((event, ...args) => {
    console.log(`Received event from ${socket.id}: ${event}`, args);
  });

  const userId = socket.handshake.query.userId;
  if (userId) {
    db.ConversationMember.findAll({ where: { userId } }).then((members) => {
      members.forEach((m) => socket.join(`conversation_${m.conversationId}`));
    });
    socket.join(`user_${userId}`);

    // Set up call handlers with user information
    setupCallHandlers(io, socket, { id: userId });
    // Set up user handlers with user information
    setupUserHandlers(io, socket, { id: userId });
    // Set up QR handlers
  }

  // Explicitly handle join events (important for call functionality)
  socket.on("join", (room) => {
    console.log(`User ${socket.handshake.query.userId} joining room: ${room}`);
    socket.join(room);

    // Log all rooms this socket is in
    console.log(
      `Socket ${socket.id} is now in rooms:`,
      Array.from(socket.rooms)
    );
  });

  socket.on("joinQRRoom", (token) => {
    console.log("Client joining room:", token);
    socket.join(token);
  });

  socket.on("chat message", (msg) => {
    const { conversationId, receiverId, message, senderId, senderName } = msg;

    if (conversationId) {
      // For group conversations, emit to the conversation room
      io.to(`conversation_${conversationId}`).emit("new_message", {
        content: message,
        senderId: senderId || socket.handshake.query.userId,
        senderName: senderName,
        conversationId,
        timestamp: new Date().toISOString(),
      });
    } else if (receiverId) {
      // For private messages, emit to both sender and receiver
      const senderUserId = senderId || socket.handshake.query.userId;
      io.to(`user_${senderUserId}`)
        .to(`user_${receiverId}`)
        .emit("new_message", {
          content: message,
          senderId: senderUserId,
          senderName: senderName,
          receiverId,
          timestamp: new Date().toISOString(),
        });
    }
  });

  socket.on("typing_start", ({ conversationId }) => {
    const userId = socket.handshake.query.userId;
    socket.to(`conversation_${conversationId}`).emit("user_typing", {
      userId: userId,
      userName: "User", // Ideally, fetch user name from database
      conversationId,
    });
  });

  socket.on("typing_end", ({ conversationId }) => {
    const userId = socket.handshake.query.userId;
    socket.to(`conversation_${conversationId}`).emit("user_stopped_typing", {
      userId: userId,
      conversationId,
    });
  });

  socket.on("message_read", async ({ messageId, conversationId }) => {
    try {
      const userId = socket.handshake.query.userId;
      // Update message read status in database
      await messageService.markMessageAsRead(messageId, userId);

      // Notify other users in the conversation
      socket.to(`conversation_${conversationId}`).emit("message_read_update", {
        messageId,
        userId: userId,
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
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
    const userId = socket.handshake.query.userId;
    if (userId) {
      db.ConversationMember.findAll({ where: { userId } })
        .then((members) => {
          members.forEach((m) =>
            socket.join(`conversation_${m.conversationId}`)
          );
        })
        .catch((error) => {
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

// Start ngrok and setup .env files for frontend / mobile
setupNgrok();
