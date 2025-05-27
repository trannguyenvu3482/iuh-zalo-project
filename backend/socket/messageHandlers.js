const db = require('../app/models');
const messageService = require('../app/services/message.service');

/**
 * Setup message-related socket event handlers
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 */
function setupMessageHandlers(io, socket) {
  const userId = socket.handshake.query.userId;

  socket.on('chat message', async (msg) => {
    const { conversationId, receiverId, message, senderId } = msg;
    console.log('Received chat message:', {
      conversationId,
      receiverId,
      message: message?.substring(0, 20),
      senderId,
    });

    // Get the sender user details
    const User = db.User;
    let senderDetails = null;

    try {
      if (senderId) {
        senderDetails = await User.findByPk(senderId, {
          attributes: ['id', 'fullName', 'avatar'],
        });
      }
    } catch (err) {
      console.error('Error fetching sender details:', err);
    }

    // Create sender object with fullName preserved
    const sender = senderDetails
      ? senderDetails.toJSON()
      : {
          id: senderId || userId,
          fullName:
            msg.senderName || socket.handshake.query.name || 'Unknown User',
          avatar: null,
        };

    if (conversationId) {
      // For group conversations, emit to the conversation room
      io.to(`conversation_${conversationId}`).emit('new_message', {
        content: message,
        senderId: senderId || userId,
        sender: sender,
        senderName: sender.fullName,
        conversationId,
        timestamp: new Date().toISOString(),
      });
    } else if (receiverId) {
      // For private messages, emit only to the receiver (not back to sender)
      const senderUserId = senderId || userId;
      io.to(`user_${receiverId}`).emit('new_message', {
        content: message,
        senderId: senderUserId,
        sender: sender,
        senderName: sender.fullName,
        receiverId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('typing_start', ({ conversationId }) => {
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId,
      userName: socket.handshake.query.name || 'User',
      conversationId,
    });
  });

  socket.on('typing_end', ({ conversationId }) => {
    socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
      userId,
      conversationId,
    });
  });

  socket.on('message_read', async ({ messageId, conversationId }) => {
    try {
      // Update message read status in database
      await messageService.markMessageAsRead(messageId, userId);

      // Notify other users in the conversation
      socket.to(`conversation_${conversationId}`).emit('message_read_update', {
        messageId,
        userId,
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });
}

module.exports = { setupMessageHandlers };
