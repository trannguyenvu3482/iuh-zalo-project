const conversationService = require("../services/conversation.service");
const { UnauthorizedError } = require("../exceptions/errors");

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
    res.status(200).json(messages);
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
    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
};

exports.updateConversation = async (req, res, next) => {
  const { conversationId, name, avatar } = req.body;
  const userId = req.user?.id;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const updatedConversation = await conversationService.updateConversation(
      conversationId,
      userId,
      name,
      avatar
    );
    if (io) {
      io.to(`conversation_${conversationId}`).emit(
        "conversation_updated",
        updatedConversation
      );
    }
    res.status(200).json(updatedConversation);
  } catch (error) {
    next(error);
  }
};

exports.getRecent = async (req, res, next) => {
  const userId = req.user?.id;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const messages = await conversationService.getRecentConversations(userId);
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

module.exports = { setIo, ...exports };
