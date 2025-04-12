const conversationService = require("../services/conversation.service");
const { UnauthorizedError, ValidationError } = require("../exceptions/errors");
const { successResponse } = require("../utils/response");
const { Op } = require("sequelize");
const db = require("../models");
const ConversationMember = db.ConversationMember;
const Conversation = db.Conversation;
const User = db.User;

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

// Helper function to handle errors consistently
const handleError = (error, res) => {
  console.error(error);
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";
  return res.status(statusCode).json({
    success: false,
    statusCode: 0,
    message,
  });
};

exports.getConversationMessages = async (req, res, next) => {
  const { conversationId } = req.params;
  const { limit = 20, offset = 0 } = req.query;
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const result = await conversationService.getConversationMessages(
      conversationId,
      userId,
      limit,
      offset
    );
    successResponse(res, "Messages fetched successfully", result);
  } catch (error) {
    next(error);
  }
};

exports.createGroup = async (req, res, next) => {
  const { name, userIds, avatar } = req.body;
  const creatorId = req?.userId;

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
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");

    const conversation = await conversationService.createPrivateConversation(
      userId,
      userId2
    );
    if (io) {
      io.to(`user_${userId2}`).emit("conversation_created", conversation);
    }
    successResponse(
      res,
      "Private conversation created successfully",
      conversation,
      201
    );
  } catch (error) {
    next(error);
  }
};

exports.setNickname = async (req, res, next) => {
  const { conversationId, nickname } = req.body;
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    if (!conversationId)
      throw new ValidationError("Conversation ID is required");
    if (!nickname) throw new ValidationError("Nickname is required");

    const conversation = await conversationService.setConversationNickname(
      conversationId,
      userId,
      nickname
    );

    // Get the other members to notify them
    const members = await ConversationMember.findAll({
      where: { conversationId, userId: { [Op.ne]: userId } },
    });

    if (io) {
      members.forEach((member) => {
        io.to(`user_${member.userId}`).emit("conversation_updated", {
          id: conversation.id,
          name: conversation.name,
        });
      });
    }

    successResponse(
      res,
      "Conversation nickname set successfully",
      conversation
    );
  } catch (error) {
    next(error);
  }
};

exports.clearChatHistory = async (req, res, next) => {
  const { conversationId } = req.body;
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    if (!conversationId)
      throw new ValidationError("Conversation ID is required");

    const result = await conversationService.clearChatHistory(
      conversationId,
      userId
    );

    // Get all members to notify them
    const members = await ConversationMember.findAll({
      where: { conversationId, userId: { [Op.ne]: userId } },
    });

    if (io) {
      members.forEach((member) => {
        io.to(`user_${member.userId}`).emit("chat_history_cleared", {
          conversationId,
          clearedBy: userId,
        });
      });
    }

    successResponse(res, "Chat history cleared successfully", result);
  } catch (error) {
    next(error);
  }
};

exports.leaveGroup = async (req, res, next) => {
  const { conversationId } = req.body;
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    if (!conversationId)
      throw new ValidationError("Conversation ID is required");

    const result = await conversationService.leaveGroup(conversationId, userId);

    // Get remaining members to notify them
    const members = await ConversationMember.findAll({
      where: { conversationId },
    });

    if (io) {
      // Notify remaining members
      members.forEach((member) => {
        io.to(`user_${member.userId}`).emit("user_left_group", {
          conversationId,
          userId,
        });
      });

      // Notify the user who left
      io.to(`user_${userId}`).emit("left_group", {
        conversationId,
      });
    }

    successResponse(res, "Left group successfully", result);
  } catch (error) {
    next(error);
  }
};

exports.deleteGroup = async (req, res, next) => {
  const { conversationId } = req.body;
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    if (!conversationId)
      throw new ValidationError("Conversation ID is required");

    const result = await conversationService.deleteGroup(
      conversationId,
      userId
    );

    if (io && result.affectedUsers) {
      // Notify all affected users
      result.affectedUsers.forEach((memberId) => {
        io.to(`user_${memberId}`).emit("group_deleted", {
          conversationId,
          deletedBy: userId,
        });
      });
    }

    successResponse(res, "Group deleted successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * Add members to a group conversation
 * @param {Object} req - Request object with conversationId and memberIds array
 * @param {Object} res - Response object
 * @returns {Object} Response with status and data
 */
exports.addGroupMembers = async (req, res) => {
  try {
    const { conversationId, memberIds } = req.body;
    const userId = req.userId;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a conversation ID",
      });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of member IDs to add",
      });
    }

    const result = await conversationService.addGroupMembers(
      conversationId,
      userId,
      memberIds
    );

    // Notify all members about the new members if successful
    if (result.success && result.addedMembers.length > 0 && io) {
      // Notify existing members
      const conversation = await Conversation.findOne({
        where: { id: conversationId },
        include: [
          {
            model: User,
            as: "members",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      });

      // Emit events to all existing members
      if (conversation && conversation.members) {
        conversation.members.forEach((member) => {
          io.to(member.id).emit("group-members-added", {
            conversationId,
            addedBy: userId,
            addedMembers: result.addedMembers,
          });
        });
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * Remove a member from a group conversation
 * @param {Object} req - Request object with conversationId and memberId
 * @param {Object} res - Response object
 * @returns {Object} Response with status and data
 */
exports.removeGroupMember = async (req, res) => {
  try {
    const { conversationId, memberId } = req.body;
    const userId = req.userId;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a conversation ID",
      });
    }

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Please provide the member ID to remove",
      });
    }

    const result = await conversationService.removeGroupMember(
      conversationId,
      userId,
      memberId
    );

    // Notify remaining members
    if (result.success && io) {
      // Get remaining members
      const conversation = await Conversation.findOne({
        where: { id: conversationId },
        include: [
          {
            model: User,
            as: "members",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      });

      // Emit events to all remaining members
      if (conversation && conversation.members) {
        conversation.members.forEach((member) => {
          io.to(member.id).emit("group-member-removed", {
            conversationId,
            removedBy: userId,
            removedMember: result.removedMember,
          });
        });
      }

      // Notify the removed member if it wasn't themselves who left
      if (userId !== memberId) {
        io.to(memberId).emit("removed-from-group", {
          conversationId,
          removedBy: userId,
        });
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

exports.getRecent = async (req, res, next) => {
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");

    // Add console logging for debugging
    console.log("Fetching recent conversations for user:", userId);

    const conversations = await conversationService.getRecentConversations(
      userId
    );

    console.log("Successfully fetched conversations:", conversations.length);

    successResponse(
      res,
      "Recent conversations fetched successfully",
      conversations
    );
  } catch (error) {
    console.error("Error in getRecent controller:", error);
    if (next) {
      return next(error);
    } else {
      return handleError(error, res);
    }
  }
};

exports.updateConversation = async (req, res, next) => {
  const { conversationId, name, avatar } = req.body;
  const userId = req?.userId; // Use userId consistently

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    if (!conversationId)
      throw new ValidationError("Conversation ID is required");

    const conversation = await conversationService.updateConversation(
      conversationId,
      userId,
      name,
      avatar
    );

    // Get all members to notify them about the update
    const members = await ConversationMember.findAll({
      where: { conversationId, userId: { [Op.ne]: userId } },
    });

    if (io) {
      members.forEach((member) => {
        io.to(`user_${member.userId}`).emit("conversation_updated", {
          id: conversation.id,
          name: conversation.name,
          avatar: conversation.avatar,
        });
      });
    }

    successResponse(res, "Conversation updated successfully", conversation);
  } catch (error) {
    next(error);
  }
};

exports.getMyConversations = async (req, res, next) => {
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");

    console.log("Fetching all conversations for user:", userId);

    const conversations = await conversationService.getUserConversations(
      userId
    );

    console.log("Successfully fetched conversations:", conversations.length);

    successResponse(res, "Conversations fetched successfully", conversations);
  } catch (error) {
    console.error("Error in getMyConversations controller:", error);
    if (next) {
      return next(error);
    } else {
      return handleError(error, res);
    }
  }
};

exports.debugConversation = async (req, res, next) => {
  const { conversationId } = req.params;
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    if (!conversationId)
      throw new ValidationError("Conversation ID is required");

    console.log("Debugging conversation:", conversationId);

    // Get the conversation with all details
    const conversation = await Conversation.findOne({
      where: { id: conversationId },
      include: [
        {
          model: User,
          as: "members",
          attributes: ["id", "username", "fullName"],
        },
      ],
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Get the direct members from ConversationMember
    const members = await ConversationMember.findAll({
      where: { conversationId },
      include: [
        {
          model: User,
          attributes: ["id", "username", "fullName"],
        },
      ],
    });

    // Return both for comparison
    successResponse(res, "Conversation details", {
      conversation,
      directMembers: members,
      memberCount: members.length,
    });
  } catch (error) {
    console.error("Error in debugConversation:", error);
    return handleError(error, res);
  }
};

module.exports = {
  setIo,
  ...exports,
};
