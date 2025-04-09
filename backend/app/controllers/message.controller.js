const messageService = require("../services/message.service");
const { UnauthorizedError, ValidationError } = require("../exceptions/errors");
const upload = require("../middleware/fileUpload");
const { successResponse } = require("../utils/response");

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

exports.sendPrivateMessage = [
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { receiverId, message, name, avatar, replyToId } = req.body;
      const senderId = req.user?.id;
      const file = req.file;

      console.log(`Request headers:`, { 
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        contentType: req.headers['content-type']
      });
      console.log(`User from request:`, { 
        userId: senderId, 
        authenticated: !!senderId
      });

      if (!senderId) throw new UnauthorizedError("Authentication required");
      if (!receiverId) throw new ValidationError("Receiver ID is required");
      if (!message && !file) throw new ValidationError("Message or file is required");
      
      console.log(`Sending private message: ${senderId} -> ${receiverId}: "${message}"`);
      
      const {
        message: newMessage,
        conversationId,
      } = await messageService.createPrivateMessage(
        senderId,
        receiverId,
        message,
        name,
        avatar,
        file,
        replyToId
      );
      
      console.log(`Message sent successfully to conversation: ${conversationId}`);
      
      if (io) {
        // Emit to both sender and receiver rooms
        io.to(`user_${senderId}`).to(`user_${receiverId}`).emit("new_message", newMessage);
        // Emit typing stopped event
        io.to(`conversation_${conversationId}`).emit("user_stopped_typing", { userId: senderId });
      }
      
      successResponse(
        res,
        "Private message sent successfully",
        { message: newMessage, conversationId },
        201
      );
    } catch (error) {
      console.error("Error in sendPrivateMessage controller:", error);
      next(error);
    }
  },
];

exports.sendGroupMessage = [
  upload.single("file"),
  async (req, res, next) => {
    const { conversationId, message, replyToId } = req.body;
    const senderId = req.user?.id;
    const file = req.file;

    try {
      if (!senderId) throw new UnauthorizedError("Authentication required");
      const newMessage = await messageService.createGroupMessage(
        senderId,
        conversationId,
        message,
        file,
        replyToId
      );
      if (io) {
        io.to(`conversation_${conversationId}`).emit("new_message", newMessage);
      }
      successResponse(res, "Group message sent successfully", newMessage, 201);
    } catch (error) {
      next(error);
    }
  },
];

module.exports = {
  setIo,
  ...exports
};
