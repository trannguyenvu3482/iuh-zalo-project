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
const { uploadFile } = require("../utils/supabase");

// Bucket name for message attachments
const MESSAGE_BUCKET = "messages";

/**
 * Upload a file to Supabase storage
 * @param {Object} file - The file object from multer middleware
 * @returns {Promise<string>} - The URL of the uploaded file
 */
const uploadMessageFile = async (file) => {
  if (!file) return null;

  try {
    // Get file data from multer
    const { buffer, originalname, mimetype } = file;

    // Determine folder based on file type
    let folder = "other";
    if (mimetype.startsWith("image/")) {
      folder = "images";
    } else if (mimetype.startsWith("video/")) {
      folder = "videos";
    } else if (mimetype.startsWith("audio/")) {
      folder = "audio";
    }

    // Upload to Supabase
    const result = await uploadFile(
      buffer,
      originalname,
      MESSAGE_BUCKET,
      folder,
      mimetype
    );

    return result.url;
  } catch (error) {
    console.error("Error uploading file to Supabase:", error);
    throw new AppError(`File upload failed: ${error.message}`, 500);
  }
};

/**
 * Helper function to get an existing conversation or create a new one
 * @param {string} senderId - The sender's user ID
 * @param {string} receiverId - The receiver's user ID
 * @param {string} name - Optional conversation name
 * @param {string} avatar - Optional conversation avatar
 * @returns {Promise<Object>} - The conversation object
 */
const getOrCreatePrivateConversation = async (
  senderId,
  receiverId,
  name = null,
  avatar = null
) => {
  // First, find conversation IDs where both users are members
  const memberOf = await ConversationMember.findAll({
    where: { userId: senderId },
    attributes: ["conversationId"],
  });

  const conversationIds = memberOf.map((m) => m.conversationId);

  let conversation;

  if (conversationIds.length === 0) {
    // Create new conversation if none exists
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
        type: "PRIVATE",
      },
      include: [
        {
          model: User,
          as: "members",
          where: { id: receiverId },
          through: { attributes: [] },
        },
      ],
    });

    if (!existingConversation) {
      // Create new conversation if none exists with both users
      conversation = await Conversation.create({
        id: uuidv4(),
        type: "PRIVATE",
        name,
        avatar,
      });
      await ConversationMember.bulkCreate([
        { userId: senderId, conversationId: conversation.id, role: "MEMBER" },
        {
          userId: receiverId,
          conversationId: conversation.id,
          role: "MEMBER",
        },
      ]);
    } else {
      conversation = existingConversation;
    }
  }

  return conversation;
};

/**
 * Validate friendship between users if required
 * @param {string} senderId - The sender's user ID
 * @param {string} receiverId - The receiver's user ID
 * @param {Object} options - Options including requireFriendship
 * @returns {Promise<void>} - Throws an error if validation fails
 */
const validateFriendship = async (senderId, receiverId, options = {}) => {
  // Check if users are friends
  const areFriends = await Friendship.findOne({
    where: {
      [Op.or]: [
        { userId: senderId, friendId: receiverId, status: "ACCEPTED" },
        { userId: receiverId, friendId: senderId, status: "ACCEPTED" },
      ],
    },
  });

  // Get configuration for friendship checks
  const { requireFriendship = false } = options;

  // Skip friendship check if:
  // 1. We're explicitly not requiring friendship (requireFriendship = false)
  // 2. We're in development mode and SKIP_FRIENDSHIP_CHECK is true
  const skipFriendshipCheck =
    !requireFriendship ||
    (process.env.NODE_ENV === "development" &&
      process.env.SKIP_FRIENDSHIP_CHECK === "true");

  if (!areFriends && !skipFriendshipCheck) {
    throw new ForbiddenError("You can only message friends");
  }
};

/**
 * Validate reply-to message exists in the conversation
 * @param {string} replyToId - The ID of the message being replied to
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<void>} - Throws an error if validation fails
 */
const validateReplyTo = async (replyToId, conversationId) => {
  if (!replyToId) return;

  const replyToMessage = await Message.findOne({
    where: { id: replyToId, conversationId },
  });
  if (!replyToMessage)
    throw new NotFoundError(
      "Message to reply to not found in this conversation"
    );
};

/**
 * Create a text or GIF message in a private conversation
 * @param {string} senderId - The sender's user ID
 * @param {string} receiverId - The receiver's user ID
 * @param {string} messageContent - The message content
 * @param {string} name - Optional conversation name
 * @param {string} avatar - Optional conversation avatar
 * @param {string} replyToId - Optional ID of message being replied to
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The created message and conversation ID
 */
exports.createPrivateTextMessage = async (
  senderId,
  receiverId,
  messageContent,
  name = null,
  avatar = null,
  replyToId = null,
  options = {}
) => {
  try {
    console.log("Creating private text message with options:", {
      messageContent,
      type: options.type,
    });

    const sender = await User.findByPk(senderId);
    const receiver = await User.findByPk(receiverId);
    if (!sender || !receiver)
      throw new NotFoundError("Sender or receiver not found");

    // Validate friendship if required
    await validateFriendship(senderId, receiverId, options);

    // Get or create a private conversation
    const conversation = await getOrCreatePrivateConversation(
      senderId,
      receiverId,
      name,
      avatar
    );

    // Validate replyToId if provided
    await validateReplyTo(replyToId, conversation.id);

    // Determine message type (TEXT or GIF)
    let messageType = options.type || "TEXT";
    let fileUrl = null;

    // For explicitly typed GIF messages, handle them correctly
    if (messageType === "GIF") {
      // For GIFs, we keep the URL in the message field, not file field
      fileUrl = null;
    }
    // Auto-detect GIFs and images from URLs if type is not explicitly set
    else if (
      !options.type &&
      messageContent &&
      messageContent.startsWith("http")
    ) {
      if (/\.gif$/i.test(messageContent)) {
        messageType = "GIF";
        fileUrl = null;
      } else if (/\.(jpe?g|png|webp|bmp)$/i.test(messageContent)) {
        messageType = "IMAGE";
        fileUrl = messageContent;
      }
    }

    // Create the message
    const message = await Message.create({
      id: uuidv4(),
      message: messageContent || null,
      sender: senderId,
      conversationId: conversation.id,
      file: fileUrl,
      replyToId,
      type: messageType,
      isSystemMessage: false,
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
    console.error("Error creating private text message:", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create private text message", 500);
  }
};

/**
 * Create a file-based message (IMAGE, VIDEO, AUDIO, FILE) in a private conversation
 * @param {string} senderId - The sender's user ID
 * @param {string} receiverId - The receiver's user ID
 * @param {string} messageContent - Optional message caption/content
 * @param {Object} file - The file object from multer
 * @param {string} name - Optional conversation name
 * @param {string} avatar - Optional conversation avatar
 * @param {string} replyToId - Optional ID of message being replied to
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The created message and conversation ID
 */
exports.createPrivateFileMessage = async (
  senderId,
  receiverId,
  messageContent,
  file,
  name = null,
  avatar = null,
  replyToId = null,
  options = {}
) => {
  try {
    if (!file) {
      throw new ValidationError("File is required for file messages");
    }

    const sender = await User.findByPk(senderId);
    const receiver = await User.findByPk(receiverId);
    if (!sender || !receiver)
      throw new NotFoundError("Sender or receiver not found");

    // Validate friendship if required
    await validateFriendship(senderId, receiverId, options);

    // Get or create a private conversation
    const conversation = await getOrCreatePrivateConversation(
      senderId,
      receiverId,
      name,
      avatar
    );

    // Validate replyToId if provided
    await validateReplyTo(replyToId, conversation.id);

    // Upload the file
    const fileUrl = await uploadMessageFile(file);

    // Determine message type based on file
    let messageType = options.type || "FILE";
    if (!options.type) {
      if (file.mimetype.startsWith("image/")) {
        messageType = file.mimetype.includes("gif") ? "GIF" : "IMAGE";
      } else if (file.mimetype.startsWith("video/")) {
        messageType = "VIDEO";
      } else if (file.mimetype.startsWith("audio/")) {
        messageType = "AUDIO";
      }
    }

    // For GIFs, we store the URL in the message field instead of the file field
    let messageField = messageContent || null;
    let fileField = fileUrl;

    if (messageType === "GIF") {
      messageField = fileUrl;
      fileField = null;
    }

    // Create the message
    const message = await Message.create({
      id: uuidv4(),
      message: messageField,
      sender: senderId,
      conversationId: conversation.id,
      file: fileField,
      replyToId,
      type: messageType,
      isSystemMessage: false,
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
    console.error("Error creating private file message:", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create private file message", 500);
  }
};

/**
 * Create a private message (legacy function for backward compatibility)
 * This function will route to the appropriate specialized function based on the input
 */
exports.createPrivateMessage = async (
  senderId,
  receiverId,
  messageContent,
  name = null,
  avatar = null,
  file = null,
  replyToId = null,
  options = {}
) => {
  try {
    // Route to the appropriate function based on whether a file is provided
    if (file) {
      return exports.createPrivateFileMessage(
        senderId,
        receiverId,
        messageContent,
        file,
        name,
        avatar,
        replyToId,
        options
      );
    } else {
      return exports.createPrivateTextMessage(
        senderId,
        receiverId,
        messageContent,
        name,
        avatar,
        replyToId,
        options
      );
    }
  } catch (error) {
    console.error("Error in createPrivateMessage:", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create private message", 500);
  }
};

/**
 * Create a text or GIF message in a group conversation
 * @param {string} senderId - The sender's user ID
 * @param {string} conversationId - The group conversation ID
 * @param {string} messageContent - The message content
 * @param {string} replyToId - Optional ID of message being replied to
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The created message
 */
exports.createGroupTextMessage = async (
  senderId,
  conversationId,
  messageContent,
  replyToId = null,
  options = {}
) => {
  try {
    console.log("Creating group text message with options:", {
      messageContent,
      type: options.type,
    });

    // Verify conversation exists and user is a member
    const conversation = await Conversation.findOne({
      where: { id: conversationId, type: "GROUP" },
      include: [{ model: User, as: "members", where: { id: senderId } }],
    });
    if (!conversation)
      throw new NotFoundError("Group does not exist or user is not a member");

    // Validate replyToId if provided
    await validateReplyTo(replyToId, conversationId);

    // Determine message type (TEXT or GIF)
    let messageType = options.type || "TEXT";
    let fileUrl = null;

    // For explicitly typed GIF messages, handle them correctly
    if (messageType === "GIF") {
      // For GIFs, we keep the URL in the message field, not file field
      fileUrl = null;
    }
    // Auto-detect GIFs and images from URLs if type is not explicitly set
    else if (
      !options.type &&
      messageContent &&
      messageContent.startsWith("http")
    ) {
      if (/\.gif$/i.test(messageContent)) {
        messageType = "GIF";
        fileUrl = null;
      } else if (/\.(jpe?g|png|webp|bmp)$/i.test(messageContent)) {
        messageType = "IMAGE";
        fileUrl = messageContent;
      }
    }

    // Create the message
    const message = await Message.create({
      id: uuidv4(),
      message: messageContent || null,
      sender: senderId,
      conversationId,
      file: fileUrl,
      replyToId,
      type: messageType,
      isSystemMessage: false,
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
    console.error("Error creating group text message:", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create group text message", 500);
  }
};

/**
 * Create a file-based message (IMAGE, VIDEO, AUDIO, FILE) in a group conversation
 * @param {string} senderId - The sender's user ID
 * @param {string} conversationId - The group conversation ID
 * @param {string} messageContent - Optional message caption/content
 * @param {Object} file - The file object from multer
 * @param {string} replyToId - Optional ID of message being replied to
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The created message
 */
exports.createGroupFileMessage = async (
  senderId,
  conversationId,
  messageContent,
  file,
  replyToId = null,
  options = {}
) => {
  try {
    if (!file) {
      throw new ValidationError("File is required for file messages");
    }

    // Verify conversation exists and user is a member
    const conversation = await Conversation.findOne({
      where: { id: conversationId, type: "GROUP" },
      include: [{ model: User, as: "members", where: { id: senderId } }],
    });
    if (!conversation)
      throw new NotFoundError("Group does not exist or user is not a member");

    // Validate replyToId if provided
    await validateReplyTo(replyToId, conversationId);

    // Upload the file
    const fileUrl = await uploadMessageFile(file);

    // Determine message type based on file
    let messageType = options.type || "FILE";
    if (!options.type) {
      if (file.mimetype.startsWith("image/")) {
        messageType = file.mimetype.includes("gif") ? "GIF" : "IMAGE";
      } else if (file.mimetype.startsWith("video/")) {
        messageType = "VIDEO";
      } else if (file.mimetype.startsWith("audio/")) {
        messageType = "AUDIO";
      }
    }

    // For GIFs, we store the URL in the message field instead of the file field
    let messageField = messageContent || null;
    let fileField = fileUrl;

    if (messageType === "GIF") {
      messageField = fileUrl;
      fileField = null;
    }

    // Create the message
    const message = await Message.create({
      id: uuidv4(),
      message: messageField,
      sender: senderId,
      conversationId,
      file: fileField,
      replyToId,
      type: messageType,
      isSystemMessage: false,
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
    console.error("Error creating group file message:", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create group file message", 500);
  }
};

/**
 * Create a group message (legacy function for backward compatibility)
 * This function will route to the appropriate specialized function based on the input
 */
exports.createGroupMessage = async (
  senderId,
  conversationId,
  messageContent,
  file = null,
  replyToId = null,
  options = {}
) => {
  try {
    // Route to the appropriate function based on whether a file is provided
    if (file) {
      return exports.createGroupFileMessage(
        senderId,
        conversationId,
        messageContent,
        file,
        replyToId,
        options
      );
    } else {
      return exports.createGroupTextMessage(
        senderId,
        conversationId,
        messageContent,
        replyToId,
        options
      );
    }
  } catch (error) {
    console.error("Error in createGroupMessage:", error);
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
exports.createSystemMessage = async (
  conversationId,
  messageContent,
  eventType = null
) => {
  try {
    console.log("Creating system message:", {
      conversationId,
      messageContent,
      eventType,
    });

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
      systemEventType: eventType,
      type: "SYSTEM",
    });

    console.log("System message created successfully:", message.id);
    return message;
  } catch (error) {
    console.error("Error creating system message:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Failed to create system message: ${error.message}`,
      500
    );
  }
};

/**
 * Recall a message
 * @param {string} messageId - ID of the message to recall
 * @param {string} userId - ID of the user trying to recall the message
 * @returns {Object} Updated message
 */
exports.recallMessage = async (messageId, userId) => {
  try {
    // Find the message
    const message = await Message.findByPk(messageId);

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    // Make sure the user is the sender of the message
    if (message.sender !== userId) {
      throw new ForbiddenError("You can only recall your own messages");
    }

    // Check if the message is already recalled
    if (message.isRecalled) {
      throw new AppError("Message is already recalled", 400);
    }

    // Recall the message
    message.isRecalled = true;
    await message.save();

    return message;
  } catch (error) {
    console.error("Error recalling message:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to recall message: ${error.message}`, 500);
  }
};
