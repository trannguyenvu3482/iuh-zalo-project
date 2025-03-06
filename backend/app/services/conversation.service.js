const { Op } = require("sequelize");
const {
  Conversation,
  User,
  ConversationMember,
  Message,
} = require("../models");
const { v4: uuidv4 } = require("uuid");
const {
  NotFoundError,
  ForbiddenError,
  AppError,
} = require("../exceptions/errors");

exports.getConversationMessages = async (conversationId, userId) => {
  try {
    const conversation = await Conversation.findOne({
      where: { id: conversationId },
      include: [{ model: User, as: "members", where: { id: userId } }],
    });
    if (!conversation)
      throw new NotFoundError(
        "Conversation does not exist or user is not a member"
      );

    const messages = await Message.findAll({
      where: { conversationId },
      order: [["created_at", "ASC"]],
      include: [
        {
          model: Message,
          as: "replyTo",
          attributes: ["id", "message", "sender", "created_at"],
        },
      ], // Include replied-to message
    });
    return messages;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch messages", 500);
  }
};

exports.createGroupConversation = async (
  name,
  userIds,
  creatorId,
  avatar = null
) => {
  try {
    const conversation = await Conversation.create({
      id: uuidv4(),
      name,
      type: "GROUP",
      avatar,
    });

    const members = userIds.map((userId) => ({
      userId,
      conversationId: conversation.id,
      role: userId === creatorId ? "CREATOR" : "MEMBER",
    }));
    await ConversationMember.bulkCreate(members);

    return conversation;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create group conversation", 500);
  }
};

exports.updateConversation = async (conversationId, userId, name, avatar) => {
  try {
    const conversation = await Conversation.findOne({
      where: { id: conversationId, type: "GROUP" },
      include: [
        {
          model: User,
          as: "members",
          where: {
            id: userId,
            "$members.ConversationMember.role$": ["CREATOR", "ADMIN"],
          },
          through: { attributes: ["role"] },
        },
      ],
    });
    if (!conversation)
      throw new ForbiddenError(
        "Conversation not found or user lacks permission"
      );

    conversation.name = name || conversation.name;
    conversation.avatar = avatar || conversation.avatar;
    await conversation.save();

    return conversation;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update conversation", 500);
  }
};

exports.getRecentConversations = async (userId) => {
  try {
    const conversations = await Conversation.findAll({
      include: [{ model: User, as: "members", where: { id: userId } }],
    });
    const conversationIds = conversations.map((c) => c.id);

    const messages = await Message.findAll({
      where: { conversationId: { [Op.in]: conversationIds } },
      order: [["created_at", "DESC"]],
      limit: 50,
    });
    return messages.reverse();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch recent conversations", 500);
  }
};
