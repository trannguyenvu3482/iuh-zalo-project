const messageHandlers = require('./messageHandlers');
const friendHandlers = require('./friendRequestHandlers');
const { setupCallHandlers } = require('./callHandlers');

io.on('connection', async (socket) => {
  // ... existing authentication code ...

  // Set up message handlers
  messageHandlers(io, socket, user);
  
  // Set up friend request handlers
  friendHandlers(io, socket, user);
  
  // Set up call handlers
  setupCallHandlers(io, socket, user);

  // ... rest of the existing code ...
}); 