const conversationService = require("../services/conversation.service");
const { UnauthorizedError } = require("../exceptions/errors");
const { successResponse } = require("../utils/response");

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

exports.getConversationMessages = async (req, res, next) => {
  const { conversationId } = req.params;
  const userId = req.user?.id;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const messages = await conversationService.getConversationMessages(
      conversationId,
      userId
    );
    successResponse(res, "Messages fetched successfully", messages);
  } catch (error) {
    next(error);
  }
};

exports.createGroup = async (req, res, next) => {
  const { name, userIds, avatar } = req.body;
  const creatorId = req.user?.id;

  try {
    if (!creatorId) throw new UnauthorizedError("Authentication required");
    const group = await conversationService.createGroupConversation(
      name,
      [...userIds, creatorId],
      creatorId,
      avatar
    );
    if (io) {
      group.members.forEach((member) => {
        io.to(`user_${member.userId}`).emit("group_created", group);
      });
    }
    successResponse(res, "Group created successfully", group, 201);
  } catch (error) {
    next(error);
  }
};

exports.createPrivateConversation = async (req, res, next) => {
  const { userId2 } = req.body;
  const userId = req.user?.id;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");

    const conversation = await conversationService.createPrivateConversation(
      userId,
      userId2
    );
    if (io) {
      io.to(`user_${userId2}`).emit("conversation_created", conversation);
    }
    successResponse(res, "Private conversation created successfully", conversation, 201);
  } catch (error) {
    next(error);
  }
};
