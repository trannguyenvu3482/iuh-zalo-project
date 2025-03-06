// services/message.service.js
const { Op } = require("sequelize");
const {
  Message,
  Conversation,
  User,
  Friendship,
  ConversationMember,
} = require("../models");
const { v4: uuidv4 } = require("uuid");
const { NotFoundError, ForbiddenError, AppError } = require("../errors");

exports.createPrivateMessage = async (
  senderId,
  receiverId,
  messageContent,
  name = null,
  avatar = null,
  file = null,
  replyToId = null
) => {
  try {
    const sender = await User.findByPk(senderId);
    const receiver = await User.findByPk(receiverId);
    if (!sender || !receiver)
      throw new NotFoundError("Sender or receiver not found");

    const areFriends = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId: senderId, friendId: receiverId, status: "ACCEPTED" },
          { userId: receiverId, friendId: senderId, status: "ACCEPTED" },
        ],
      },
    });
    if (!areFriends) throw new ForbiddenError("You can only message friends");

    let conversation = await Conversation.findOne({
      where: { type: "PRIVATE" },
      include: [
        {
          model: User,
          as: "members",
          where: { id: { [Op.in]: [senderId, receiverId] } },
          through: { attributes: [] },
        },
      ],
      having: db.Sequelize.literal('COUNT(DISTINCT "members"."id") = 2'),
      group: ["conversations.id"],
    });

    if (!conversation) {
      conversation = await Conversation.create({
        id: uuidv4(),
        type: "PRIVATE",
        name,
        avatar,
      });
      await ConversationMember.bulkCreate([
        { userId: senderId, conversationId: conversation.id, role: "MEMBER" },
        { userId: receiverId, conversationId: conversation.id, role: "MEMBER" },
      ]);
    }

    // Validate replyToId if provided
    if (replyToId) {
      const replyToMessage = await Message.findOne({
        where: { id: replyToId, conversationId: conversation.id },
      });
      if (!replyToMessage)
        throw new NotFoundError(
          "Message to reply to not found in this conversation"
        );
    }

    const message = await Message.create({
      id: uuidv4(),
      message: messageContent || null,
      sender: senderId,
      conversationId: conversation.id,
      file: file ? file.path : null, // Adjust to file.location if using S3
      replyToId,
    });

    // Include the replied-to message in the response
    if (message.replyToId) {
      await message.reload({ include: [{ model: Message, as: "replyTo" }] });
    }

    return { message, conversationId: conversation.id };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create private message", 500);
  }
};

exports.createGroupMessage = async (
  senderId,
  conversationId,
  messageContent,
  file = null,
  replyToId = null
) => {
  try {
    const conversation = await Conversation.findOne({
      where: { id: conversationId, type: "GROUP" },
      include: [{ model: User, as: "members", where: { id: senderId } }],
    });
    if (!conversation)
      throw new NotFoundError("Group does not exist or user is not a member");

    // Validate replyToId if provided
    if (replyToId) {
      const replyToMessage = await Message.findOne({
        where: { id: replyToId, conversationId },
      });
      if (!replyToMessage)
        throw new NotFoundError(
          "Message to reply to not found in this conversation"
        );
    }

    const message = await Message.create({
      id: uuidv4(),
      message: messageContent || null,
      sender: senderId,
      conversationId,
      file: file ? file.path : null, // Adjust to file.location if using S3
      replyToId,
    });

    // Include the replied-to message in the response
    if (message.replyToId) {
      await message.reload({ include: [{ model: Message, as: "replyTo" }] });
    }

    return message;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create group message", 500);
  }
};
