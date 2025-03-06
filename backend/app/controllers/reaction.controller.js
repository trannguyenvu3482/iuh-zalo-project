const reactionService = require("../services/reaction.service");
const { UnauthorizedError } = require("../errors");

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

exports.editMessage = async (req, res, next) => {
  const { messageId, message } = req.body;
  const userId = req.user?.id;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const updatedMessage = await reactionService.editMessage(
      messageId,
      userId,
      message
    );
    if (io) {
      io.to(`conversation_${updatedMessage.conversationId}`).emit(
        "message_edited",
        updatedMessage
      );
    }
    res.status(200).json(updatedMessage);
  } catch (error) {
    next(error);
  }
};

exports.addReaction = async (req, res, next) => {
  const { messageId, type } = req.body;
  const userId = req.user?.id;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const reaction = await reactionService.addReaction(messageId, userId, type);
    const message = await reactionService.Message.findByPk(messageId);
    if (io) {
      io.to(`conversation_${message.conversationId}`).emit(
        "new_reaction",
        reaction
      );
    }
    res.status(201).json(reaction);
  } catch (error) {
    next(error);
  }
};

exports.getReactions = async (req, res, next) => {
  const { messageId } = req.params;
  const { aggregate } = req.query;
  const userId = req.user?.id;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const reactions = await reactionService.getReactions(
      messageId,
      aggregate === "true"
    );
    res.status(200).json(reactions);
  } catch (error) {
    next(error);
  }
};

module.exports = { setIo, ...exports };
