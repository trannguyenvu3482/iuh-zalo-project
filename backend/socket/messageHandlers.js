const handleShareMessage = async (io, socket, { messageId, targetConversationId }) => {
  try {
    // Fetch the original message
    const originalMessage = await Message.findByPk(messageId);

    if (!originalMessage) {
      return socket.emit('error', { message: 'Message not found' });
    }

    // Create a new message in the target conversation
    const sharedMessage = await Message.create({
      content: originalMessage.content,
      senderId: socket.user.id, // The user sharing the message
      conversationId: targetConversationId,
      isShared: true, // Optional flag to indicate it's a shared message
    });

    // Notify participants in the target conversation
    io.to(`conversation_${targetConversationId}`).emit('new_message', sharedMessage);
  } catch (error) {
    console.error('Error sharing message:', error);
    socket.emit('error', { message: 'Failed to share message' });
  }
};

module.exports = { handleShareMessage };