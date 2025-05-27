const { friendService } = require("../app/services/friend.service");

/**
 * Setup friend-related socket event handlers
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 */
function setupFriendHandlers(io, socket) {
  const userId = socket.handshake.query.userId;
  const userName = socket.handshake.query.name || "Someone";

  socket.on("friend_request", (data) => {
    const { friendId } = data;

    console.log(`Friend request from ${userId} to ${friendId}`);

    if (friendId) {
      // Check if recipient is online
      const recipientRoom = io.sockets.adapter.rooms.get(`user_${friendId}`);
      const isRecipientOnline = Boolean(recipientRoom && recipientRoom.size > 0);

      // Forward the friend request to the recipient
      io.to(`user_${friendId}`).emit("friend_request", {
        id: Date.now(), // temporary ID to track the notification
        from: userId,
        senderId: userId,
        friendId: userId,
        senderName: userName,
        timestamp: new Date().toISOString(),
      });

      // Let the sender know whether the recipient is online
      socket.emit("friend_request_delivered", {
        friendId,
        isDelivered: true,
        isRecipientOnline,
      });
    }
  });

  socket.on("friend_accepted", (data) => {
    const { requestId, from } = data;

    console.log(`Friend accepted: request ${requestId} from ${userId} to ${from}`);

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
    const { requestId, from } = data;

    console.log(`Friend rejected: request ${requestId} from ${userId} to ${from}`);

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
    const { friendId } = data;

    console.log(`Friend request canceled from ${userId} to ${friendId}`);

    if (friendId) {
      try {
        // Update the database
        await friendService.cancelFriendRequest(userId, friendId);

        // Notify the recipient
        io.to(`user_${friendId}`).emit("friend_request_canceled", {
          from: userId,
          friendId: friendId,
          timestamp: new Date().toISOString(),
        });

        // Confirm to the sender
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
}

module.exports = { setupFriendHandlers };
