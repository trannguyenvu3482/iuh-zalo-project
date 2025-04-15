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
      const { receiverId, message, name, avatar, replyToId, type } = req.body;
      const senderId = req.user?.id;
      const file = req.file;

      console.log(`Request headers:`, {
        authorization: req.headers.authorization ? "Present" : "Missing",
        contentType: req.headers["content-type"],
      });
      console.log(`User from request:`, {
        userId: senderId,
        authenticated: !!senderId,
      });

      if (!senderId) throw new UnauthorizedError("Authentication required");
      if (!receiverId) throw new ValidationError("Receiver ID is required");
      if (!message && !file)
        throw new ValidationError("Message or file is required");

      console.log(
        `Sending private message: ${senderId} -> ${receiverId}: "${message}"`
      );

      // Allow messaging between non-friends by default
      const options = {
        requireFriendship: false,
        type,
      };

      const { message: newMessage, conversationId } =
        await messageService.createPrivateMessage(
          senderId,
          receiverId,
          message,
          name,
          avatar,
          file,
          replyToId,
          options
        );

      console.log(
        `Message sent successfully to conversation: ${conversationId}`
      );

      if (io) {
        // Emit to both sender and receiver rooms
        io.to(`user_${senderId}`)
          .to(`user_${receiverId}`)
          .emit("new_message", newMessage);
        // Emit typing stopped event
        io.to(`conversation_${conversationId}`).emit("user_stopped_typing", {
          userId: senderId,
        });
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
    const { conversationId, message, replyToId, type } = req.body;
    const senderId = req.user?.id;
    const file = req.file;

    try {
      if (!senderId) throw new UnauthorizedError("Authentication required");

      // Pass the type parameter to the service
      const options = { type };

      const newMessage = await messageService.createGroupMessage(
        senderId,
        conversationId,
        message,
        file,
        replyToId,
        options
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

exports.recallMessage = async (req, res, next) => {
  try {
    const { messageId } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new UnauthorizedError("Authentication required");
    if (!messageId) throw new ValidationError("Message ID is required");

    console.log(`Recalling message ${messageId} by user ${userId}`);

    const updatedMessage = await messageService.recallMessage(
      messageId,
      userId
    );

    // Get the conversation ID to notify other members
    const conversationId = updatedMessage.conversationId;

    if (io) {
      // Emit a message_recalled event to all users in the conversation
      io.to(`conversation_${conversationId}`).emit("message_recalled", {
        messageId,
        updatedMessage,
      });
    }

    successResponse(res, "Message recalled successfully", updatedMessage);
  } catch (error) {
    console.error("Error in recallMessage controller:", error);
    next(error);
  }
};

module.exports = {
  setIo,
  ...exports,
};
