// services/message.service.js
const { Op } = require("sequelize");
const db = require("../models");
const {
  Message,
  Conversation,
  User,
  Friendship,
  ConversationMember,
} = require("../models");
const { v4: uuidv4 } = require("uuid");
const {
  NotFoundError,
  ForbiddenError,
  AppError,
} = require("../exceptions/errors");

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
    console.log(`Creating private message: senderId=${senderId}, receiverId=${receiverId}`);
    
    const sender = await User.findByPk(senderId);
    const receiver = await User.findByPk(receiverId);
    if (!sender || !receiver)
      throw new NotFoundError("Sender or receiver not found");

    // Check if users are friends
    const areFriends = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId: senderId, friendId: receiverId, status: "ACCEPTED" },
          { userId: receiverId, friendId: senderId, status: "ACCEPTED" },
        ],
      },
    });
    
    console.log(`Friendship check: ${!!areFriends}`);
    
    // Skip friendship check if in development mode
    const skipFriendshipCheck = process.env.NODE_ENV === 'development' && process.env.SKIP_FRIENDSHIP_CHECK === 'true';
    
    if (!areFriends && !skipFriendshipCheck) {
      throw new ForbiddenError("You can only message friends");
    }

    // First, find conversation IDs where both users are members
    const memberOf = await ConversationMember.findAll({
      where: { userId: senderId },
      attributes: ['conversationId']
    });
    
    const conversationIds = memberOf.map(m => m.conversationId);
    console.log(`Found ${conversationIds.length} conversations for sender`);
    
    let conversation;
    
    if (conversationIds.length === 0) {
      // Create new conversation if none exists
      console.log("No existing conversations, creating new one");
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
    } else {
      // Find private conversation with both users
      const existingConversation = await Conversation.findOne({
        where: { 
          id: { [Op.in]: conversationIds },
          type: "PRIVATE" 
        },
        include: [
          {
            model: User,
            as: "members",
            where: { id: receiverId },
            through: { attributes: [] },
          },
        ]
      });
      
      if (!existingConversation) {
        // Create new conversation if none exists with both users
        console.log("No existing conversation with both users, creating new one");
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
      } else {
        console.log(`Found existing conversation: ${existingConversation.id}`);
        conversation = existingConversation;
      }
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

    // Update conversation timestamp
    await Conversation.update(
      { updated_at: new Date() },
      { where: { id: conversation.id } }
    );

    // Include the replied-to message in the response
    if (message.replyToId) {
      await message.reload({ include: [{ model: Message, as: "replyTo" }] });
    }

    return { message, conversationId: conversation.id };
  } catch (error) {
    console.error("Error creating private message:", error);
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

    // Update conversation timestamp
    await Conversation.update(
      { updated_at: new Date() },
      { where: { id: conversationId } }
    );

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

/**
 * Create a system message
 * @param {string} conversationId - ID of the conversation
 * @param {string} messageContent - System message content
 * @param {string} eventType - Type of system event (e.g., 'USER_JOINED', 'USER_LEFT')
 * @returns {Object} Created message
 */
exports.createSystemMessage = async (conversationId, messageContent, eventType = null) => {
  try {
    console.log("Creating system message:", { conversationId, messageContent, eventType });
    
    // Verify conversation exists
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }
    
    // Create system message
    const message = await Message.create({
      id: uuidv4(),
      message: messageContent,
      sender: null, // null sender indicates system message
      conversationId,
      isSystemMessage: true,
      systemEventType: eventType
    });
    
    console.log("System message created successfully:", message.id);
    return message;
  } catch (error) {
    console.error("Error creating system message:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to create system message: ${error.message}`, 500);
  }
};
