const messageService = require("../services/message.service");
const { UnauthorizedError } = require("../exceptions/errors");
const upload = require("../middleware/fileUpload");
const { successResponse } = require("../utils/response");

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

exports.sendPrivateMessage = [
  upload.single("file"),
  async (req, res, next) => {
    const { receiverId, message, name, avatar, replyToId } = req.body;
    const senderId = req.user?.id;
    const file = req.file;

    try {
      if (!senderId) throw new UnauthorizedError("Authentication required");
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
