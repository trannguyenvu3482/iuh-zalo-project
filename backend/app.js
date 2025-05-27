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

// Import socket handlers
const { setupCallHandlers } = require("./socket/callHandlers");
const { setupUserHandlers } = require("./socket/userHandlers");
const { setupQRHandlers } = require("./socket/qrHandlers");
const { setupMessageHandlers } = require("./socket/messageHandlers");
const { setupFriendHandlers } = require("./socket/friendHandlers");
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
const tokenRoutes = require("./routes/tokenRoutes");
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
  });

  const userId = socket.handshake.query.userId;
  if (userId) {
    console.log(`Setting up authenticated socket for user ${userId}`);

    // Join user's room for private notifications
    socket.join(`user_${userId}`);
    
    // Join all conversation rooms the user is a member of
    db.ConversationMember.findAll({ where: { userId } })
      .then((members) => {
        members.forEach((m) => socket.join(`conversation_${m.conversationId}`));
      })
      .catch((error) => {
        console.error(`Error joining conversation rooms for user ${userId}:`, error);
      });

    // Set up all handlers with user information
    setupCallHandlers(io, socket, { id: userId });
    setupUserHandlers(io, socket, { id: userId });
    setupMessageHandlers(io, socket);
    setupFriendHandlers(io, socket);
  } else {
    console.log(`Unauthenticated socket connection: ${socket.id}`);
  }

  // Setup QR handlers for all connections
  setupQRHandlers(io, socket);

  // Handle room joining
  socket.on("join", (room) => {
    console.log(`User ${socket.handshake.query.userId} joining room: ${room}`);
    socket.join(room);
  });

  socket.on("joinQRRoom", (token) => {
    console.log("Client joining room:", token);
    socket.join(token);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
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
