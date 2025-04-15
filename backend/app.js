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
    methods: ["GET", "POST", "PUT", "DELETE"],
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

db.sequelize.sync({ alter: true }).then(() => {
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
  const auth = socket.handshake.query;
  console.log("A user connected:", {
    socketId: socket.id,
    userId: auth.userId,
    name: auth.name,
    rooms: Array.from(socket.rooms || []),
    queryParams: socket.handshake.query,
  });

  setupQRHandlers(io, socket);

  socket.onAny((event, ...args) => {
    console.log(`Received event from ${socket.id}: ${event}`, args);
  });

  const userId = socket.handshake.query.userId;
  if (userId) {
    console.log(`Setting up authenticated socket for user ${userId}`);

    // Join user's room for private notifications
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room: user_${userId}`);

    // Join all conversation rooms the user is a member of
    db.ConversationMember.findAll({ where: { userId } })
      .then((members) => {
        const conversationRooms = members.map(
          (m) => `conversation_${m.conversationId}`
        );
        console.log(
          `User ${userId} joining conversation rooms:`,
          conversationRooms
        );

        members.forEach((m) => socket.join(`conversation_${m.conversationId}`));

        // Log all rooms this socket is in after joining
        console.log(
          `User ${userId} is in rooms:`,
          Array.from(socket.rooms || [])
        );
      })
      .catch((error) => {
        console.error(
          `Error joining conversation rooms for user ${userId}:`,
          error
        );
      });

    // Set up call handlers with user information
    setupCallHandlers(io, socket, { id: userId });
    // Set up user handlers with user information
    setupUserHandlers(io, socket, { id: userId });
  } else {
    console.log(`Unauthenticated socket connection: ${socket.id}`);
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
    const userId = socket.handshake.query.userId;
    const { friendId } = data;

    console.log(`Friend request from ${userId} to ${friendId}`, data);

    if (friendId) {
      // Find if the recipient is online
      const recipientRoom = io.sockets.adapter.rooms.get(`user_${friendId}`);
      const isRecipientOnline = Boolean(
        recipientRoom && recipientRoom.size > 0
      );

      console.log(`Recipient ${friendId} online status:`, {
        isOnline: isRecipientOnline,
        roomSize: recipientRoom?.size || 0,
        roomExists: !!recipientRoom,
        allRooms: Object.keys(io.sockets.adapter.rooms || {})
          .filter((room) => room.startsWith("user_"))
          .map((room) => room.replace("user_", "")),
      });

      // Forward the friend request to the recipient
      io.to(`user_${friendId}`).emit("friend_request", {
        id: Date.now(), // temporary ID to track the notification
        from: userId,
        senderId: userId,
        friendId: userId,
        senderName: socket.handshake.query.name || "Someone",
        timestamp: new Date().toISOString(),
      });

      console.log(`Friend request event emitted to user_${friendId} room`);

      // Debug: Check connected sockets
      const connectedSockets = Array.from(io.sockets.sockets.keys());
      console.log(
        `All connected socket IDs (${connectedSockets.length}):`,
        connectedSockets
      );

      // Let the sender know whether the recipient is online
      socket.emit("friend_request_delivered", {
        friendId,
        isDelivered: true,
        isRecipientOnline,
      });
    }
  });

  socket.on("friend_accepted", (data) => {
    const userId = socket.handshake.query.userId;
    const { requestId, from } = data;

    console.log(
      `Friend accepted: request ${requestId} from ${userId} to ${from}`
    );

    // Forward the acceptance to the original requester
    if (from) {
      io.to(`user_${from}`).emit("friend_accepted", {
        requestId,
        from: userId,
        friendId: userId,
      });
    }
  });

  socket.on("friend_rejected", (data) => {
    const userId = socket.handshake.query.userId;
    const { requestId, from } = data;

    console.log(
      `Friend rejected: request ${requestId} from ${userId} to ${from}`
    );

    // Forward the rejection to the original requester
    if (from) {
      io.to(`user_${from}`).emit("friend_rejected", {
        requestId,
        from: userId,
        friendId: userId,
      });
    }
  });

  socket.on("friend_request_canceled", async (data) => {
    const userId = socket.handshake.query.userId;
    const { friendId } = data;

    console.log(`Friend request canceled from ${userId} to ${friendId}`, data);

    if (friendId) {
      try {
        // Immediately update the database to ensure API calls get fresh data
        const { friendService } = require("./app/services");
        await friendService.cancelFriendRequest(userId, friendId);
        console.log(
          `Database updated for cancellation from ${userId} to ${friendId}`
        );

        // Find if the recipient is online
        const recipientRoom = io.sockets.adapter.rooms.get(`user_${friendId}`);
        const isRecipientOnline = Boolean(
          recipientRoom && recipientRoom.size > 0
        );

        console.log(`Recipient ${friendId} online status for cancellation:`, {
          isOnline: isRecipientOnline,
          roomSize: recipientRoom?.size || 0,
        });

        // Forward the cancellation to the recipient
        io.to(`user_${friendId}`).emit("friend_request_canceled", {
          from: userId,
          friendId: friendId,
          timestamp: new Date().toISOString(),
        });

        // Also emit a confirmation back to the sender
        socket.emit("friend_request_canceled_confirmed", {
          success: true,
          friendId: friendId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Error processing friend request cancellation:`, error);
        socket.emit("error", {
          message: "Failed to cancel friend request",
          error: error.message,
        });
      }
    }
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
if (process.env.NGROK_ENABLED === "true") {
  setupNgrok();
}
