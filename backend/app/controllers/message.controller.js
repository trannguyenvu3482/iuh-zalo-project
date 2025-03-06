// controllers/message.controller.js
const messageService = require("../services/message.service");
const { UnauthorizedError } = require("../exceptions/errors");
const upload = require("../middleware/fileUpload");

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
        io.to(`conversation_${conversationId}`).emit("new_message", newMessage);
      }
      res.status(201).json({ message: newMessage, conversationId });
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
      res.status(201).json(newMessage);
    } catch (error) {
      next(error);
    }
  },
];

module.exports = {
  setIo,
  sendPrivateMessage: exports.sendPrivateMessage,
  sendGroupMessage: exports.sendGroupMessage,
};
