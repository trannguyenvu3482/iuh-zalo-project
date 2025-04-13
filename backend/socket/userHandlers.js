// Handle user profile updates through socket.io

/**
 * Set up all user-related event handlers
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Socket instance for the current connection
 * @param {Object} user - The authenticated user
 */
const setupUserHandlers = (io, socket, user) => {
  console.log(
    `Setting up user handlers for user ${user?.id}, socket ${socket.id}`
  );

  // Centralized function to emit profile updates
  const emitProfileUpdate = (userId, userData) => {
    // Emit to user's own sockets across all devices
    io.to(`user_${userId}`).emit("user:profile_updated", {
      user: userData,
      timestamp: new Date().toISOString(),
    });

    console.log(`Emitted profile update for user ${userId}`);
  };

  // Register socket method to manually trigger a profile update notification
  socket.on("user:update_profile", (data) => {
    if (!user || !user.id) {
      console.error("Unauthorized profile update attempt");
      return;
    }

    if (data && data.userId && user.id === data.userId) {
      emitProfileUpdate(user.id, data.userData || {});
    }
  });

  return {
    // Expose function to allow server-side triggering of profile update notifications
    emitProfileUpdate,
  };
};

module.exports = { setupUserHandlers };
