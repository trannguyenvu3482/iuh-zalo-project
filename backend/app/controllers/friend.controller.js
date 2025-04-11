const friendService = require("../services/friend.service");
const conversationService = require("../services/conversation.service");
const messageService = require("../services/message.service");
const {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} = require("../exceptions/errors");
const { successResponse } = require("../utils/response");
const { Conversation, User, ConversationMember } = require("../models");
const db = require("../models");
const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

exports.addFriend = async (req, res, next) => {
  const { friendId } = req.body;

  if (!friendId) return next(new ValidationError("Friend ID is required"));

  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const friendship = await friendService.addFriend(userId, friendId);
    if (io) {
      io.to(`user_${friendship.friendId}`).emit("friend_request", {
        from: userId,
        friendshipId: friendship.id,
      });
    }
    successResponse(res, "Friend request sent successfully", friendship);
  } catch (error) {
    next(error);
  }
};

exports.acceptFriend = async (req, res, next) => {
  const { friendId } = req.body;
  const userId = req?.userId;

  try {
    if (!friendId) throw new ValidationError("Friend ID is required");
    if (!userId) throw new UnauthorizedError("Authentication required");

    console.log("Accepting friend request:", { userId, friendId });

    // Accept the friend request
    const friendship = await friendService.acceptFriend(userId, friendId);
    console.log("Friendship accepted:", friendship.id);

    try {
      // Create a conversation between the two users
      const conversation = await conversationService.createPrivateConversation(
        userId,
        friendId
      );
      console.log("Conversation created/found:", conversation.id);

      try {
        // Create welcome system message
        await messageService.createSystemMessage(
          conversation.id,
          "You are now connected! Say hello to your new friend.",
          "FRIEND_CONNECTED"
        );

        if (io) {
          io.to(`user_${friendId}`).emit("friend_accepted", { from: userId });
          io.to(`user_${friendId}`).emit("conversation_created", {
            conversation,
            from: userId,
          });
        }

        successResponse(res, "Friend request accepted successfully", {
          friendship,
          conversation,
        });
      } catch (msgError) {
        console.error("Error creating system message:", msgError);
        // Continue even if system message fails
        successResponse(res, "Friend request accepted successfully", {
          friendship,
          conversation,
          note: "System message could not be created",
        });
      }
    } catch (convError) {
      console.error("Error creating conversation:", convError);
      // Return success for friendship but note the conversation error
      successResponse(
        res,
        "Friend request accepted but conversation creation failed",
        {
          friendship,
          error: convError.message,
        }
      );
    }
  } catch (error) {
    console.error("Error accepting friend request:", error);
    next(error);
  }
};

exports.getFriendList = async (req, res, next) => {
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const friends = await friendService.getFriendList(userId);
    successResponse(res, "Friends fetched successfully", friends);
  } catch (error) {
    next(error);
  }
};

exports.getMyFriendRequests = async (req, res, next) => {
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const friendRequests = await friendService.getMyFriendRequests(userId);
    successResponse(
      res,
      "Friend requests fetched successfully",
      friendRequests
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a friend request
 */
exports.rejectFriend = async (req, res, next) => {
  const { friendId } = req.body;
  const userId = req?.userId;

  try {
    if (!friendId) throw new ValidationError("Friend ID is required");
    if (!userId) throw new UnauthorizedError("Authentication required");

    const friendship = await friendService.rejectFriend(userId, friendId);

    if (io) {
      io.to(`user_${friendId}`).emit("friend_rejected", { from: userId });
    }

    successResponse(res, "Friend request rejected successfully", friendship);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a friend (unfriend)
 */
exports.removeFriend = async (req, res, next) => {
  const { friendId } = req.body;
  const userId = req?.userId;

  try {
    if (!friendId) throw new ValidationError("Friend ID is required");
    if (!userId) throw new UnauthorizedError("Authentication required");

    await friendService.removeFriend(userId, friendId);

    if (io) {
      io.to(`user_${friendId}`).emit("friend_removed", { from: userId });
    }

    successResponse(res, "Friend removed successfully", { success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a friend request that was sent
 */
exports.cancelFriendRequest = async (req, res, next) => {
  const { friendId } = req.body;
  const userId = req?.userId;

  try {
    if (!friendId) throw new ValidationError("Friend ID is required");
    if (!userId) throw new UnauthorizedError("Authentication required");

    await friendService.cancelFriendRequest(userId, friendId);

    if (io) {
      io.to(`user_${friendId}`).emit("friend_request_canceled", {
        from: userId,
      });
    }

    successResponse(res, "Friend request canceled successfully", {
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all sent friend requests that are pending
 */
exports.getSentFriendRequests = async (req, res, next) => {
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");

    const sentRequests = await friendService.getSentFriendRequests(userId);
    successResponse(
      res,
      "Sent friend requests fetched successfully",
      sentRequests
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get friendship status with a specific user
 */
exports.getFriendshipStatus = async (req, res, next) => {
  const { userId: otherUserId } = req.params;
  const userId = req?.userId;

  try {
    if (!otherUserId) throw new ValidationError("User ID is required");
    if (!userId) throw new UnauthorizedError("Authentication required");

    const status = await friendService.getFriendshipStatus(userId, otherUserId);
    successResponse(res, "Friendship status fetched successfully", status);
  } catch (error) {
    next(error);
  }
};

/**
 * Get friend suggestions
 */
exports.getFriendSuggestions = async (req, res, next) => {
  const userId = req?.userId;
  const { limit } = req.query;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");

    const suggestions = await friendService.getFriendSuggestions(
      userId,
      limit ? parseInt(limit, 10) : 10
    );

    successResponse(
      res,
      "Friend suggestions fetched successfully",
      suggestions
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Debug function for accepting a friend request
 */
exports.tryAcceptFriend = async (req, res, next) => {
  const { friendId } = req.body;
  const userId = req?.userId;

  try {
    console.log("Debug accept friend request:", { userId, friendId });

    if (!friendId) throw new ValidationError("Friend ID is required");
    if (!userId) throw new UnauthorizedError("Authentication required");

    // Step 1: Accept the friend request
    console.log("Step 1: Accept friend request");
    const friendship = await friendService.acceptFriend(userId, friendId);
    console.log("Friendship accepted:", friendship.id);

    // Step 2: Try to find an existing conversation first using raw SQL
    console.log("Step 2: Check for existing conversation");
    const query = `
      SELECT c.id 
      FROM conversations c
      JOIN conversation_members cm1 ON c.id = cm1."conversationId" AND cm1."userId" = :userId1
      JOIN conversation_members cm2 ON c.id = cm2."conversationId" AND cm2."userId" = :userId2
      WHERE c.type = 'PRIVATE'
      LIMIT 1
    `;

    const results = await db.sequelize.query(query, {
      replacements: { userId1: userId, userId2: friendId },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    let conversation;

    if (results.length > 0 && results[0].id) {
      const existingId = results[0].id;
      console.log("Existing conversation found:", existingId);

      conversation = await Conversation.findOne({
        where: { id: existingId },
        include: [
          {
            model: User,
            as: "members",
            attributes: ["id", "username", "fullName", "avatar", "status"],
          },
        ],
      });
    } else {
      // Step 3: Create a new conversation
      console.log("Step 3: Creating new private conversation");
      conversation = await conversationService.createPrivateConversation(
        userId,
        friendId
      );
      console.log("New conversation created:", conversation.id);
    }

    // Step 4: Create welcome system message
    console.log("Step 4: Creating welcome message");
    const systemMessage = await messageService.createSystemMessage(
      conversation.id,
      "You are now connected! Say hello to your new friend.",
      "FRIEND_CONNECTED"
    );
    console.log("System message created:", systemMessage.id);

    if (io) {
      io.to(`user_${friendId}`).emit("friend_accepted", { from: userId });
      io.to(`user_${friendId}`).emit("conversation_created", {
        conversation,
        from: userId,
      });
    }

    successResponse(res, "Friend request debug successful", {
      friendship,
      conversation,
      systemMessage,
    });
  } catch (error) {
    console.error("Error in tryAcceptFriend:", error);
    next(error);
  }
};

/**
 * Test function to create a private conversation (for debugging)
 */
exports.testCreateConversation = async (req, res, next) => {
  const { userId1, userId2 } = req.body;

  try {
    console.log("Testing conversation creation between:", { userId1, userId2 });

    if (!userId1 || !userId2) {
      throw new ValidationError("Both user IDs are required");
    }

    // First try to find an existing conversation using raw SQL
    console.log("Testing the find existing conversation query...");
    const query = `
      SELECT c.id 
      FROM conversations c
      JOIN conversation_members cm1 ON c.id = cm1."conversationId" AND cm1."userId" = :userId1
      JOIN conversation_members cm2 ON c.id = cm2."conversationId" AND cm2."userId" = :userId2
      WHERE c.type = 'PRIVATE'
      LIMIT 1
    `;

    const results = await db.sequelize.query(query, {
      replacements: { userId1, userId2 },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (results.length > 0 && results[0].id) {
      console.log("Found existing conversation:", results[0].id);
      const fullConversation = await Conversation.findOne({
        where: { id: results[0].id },
        include: [
          {
            model: User,
            as: "members",
            attributes: ["id", "username", "fullName", "avatar", "status"],
          },
        ],
      });

      // Also check members directly
      const members = await ConversationMember.findAll({
        where: { conversationId: results[0].id },
        raw: true,
      });

      successResponse(res, "Found existing conversation", {
        existingId: results[0].id,
        conversation: fullConversation,
        members: members,
      });
      return;
    }

    // Directly create a conversation and members for testing
    console.log("Creating a conversation directly for testing");

    // 1. Create conversation
    const conversation = await Conversation.create({
      id: uuidv4(),
      type: "PRIVATE",
    });
    console.log("Test conversation created:", conversation.id);

    // 2. Create members directly in conversation_members table
    console.log("Creating conversation members");
    await ConversationMember.bulkCreate([
      { userId: userId1, conversationId: conversation.id, role: "MEMBER" },
      { userId: userId2, conversationId: conversation.id, role: "MEMBER" },
    ]);

    // 3. Check if the members were correctly created
    console.log("Checking if members were created correctly");
    const savedMembers = await ConversationMember.findAll({
      where: { conversationId: conversation.id },
      raw: true,
    });
    console.log("Found members:", JSON.stringify(savedMembers, null, 2));

    // 4. Check if the service can retrieve the conversation with members
    console.log("Retrieving the conversation with members");
    const fullConversation = await Conversation.findOne({
      where: { id: conversation.id },
      include: [
        {
          model: User,
          as: "members",
          attributes: ["id", "username", "fullName", "avatar", "status"],
        },
      ],
    });

    successResponse(res, "Test conversation created successfully", {
      conversation,
      memberCount: savedMembers.length,
      members: savedMembers,
      fullConversation,
    });
  } catch (error) {
    console.error("Error in test conversation creation:", error);
    next(error);
  }
};

/**
 * Debug function to check the conversation_members table directly
 */
exports.checkConversationMembers = async (req, res, next) => {
  const { conversationId } = req.params;

  try {
    console.log(
      `Checking conversation_members for conversation: ${conversationId}`
    );

    if (!conversationId) {
      throw new ValidationError("Conversation ID is required");
    }

    // Get the conversation
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    // Get members directly from the conversation_members table
    const members = await ConversationMember.findAll({
      where: { conversationId },
      raw: true,
    });

    console.log(
      `Found ${members.length} members in conversation_members table`
    );

    // Get user details for these members
    const userIds = members.map((m) => m.userId);
    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ["id", "username", "fullName", "avatar"],
    });

    // Get the conversation with members through the association
    const conversationWithMembers = await Conversation.findOne({
      where: { id: conversationId },
      include: [
        {
          model: User,
          as: "members",
          attributes: ["id", "username", "fullName"],
        },
      ],
    });

    // Compare the results
    const associationMemberCount = conversationWithMembers.members?.length || 0;

    successResponse(res, "Conversation members check", {
      conversation,
      directMembers: members,
      users,
      associationMemberCount,
      membersViaAssociation: conversationWithMembers.members || [],
    });
  } catch (error) {
    console.error("Error checking conversation members:", error);
    next(error);
  }
};

module.exports = { setIo, ...exports };
