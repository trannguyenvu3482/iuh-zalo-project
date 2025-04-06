const { Op } = require("sequelize");
const db = require("../models");
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
const { Sequelize } = require("sequelize");
const sequelize = db.sequelize;

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

exports.createPrivateConversation = async (userId1, userId2) => {
  try {
    console.log(`Attempting to create/find private conversation between users ${userId1} and ${userId2}`);
    
    // First, use a simpler query to check for an existing private conversation
    // between these two users without using GROUP BY
    const query = `
      SELECT c.id 
      FROM conversations c
      JOIN conversation_members cm1 ON c.id = cm1."conversationId" AND cm1."userId" = :userId1
      JOIN conversation_members cm2 ON c.id = cm2."conversationId" AND cm2."userId" = :userId2
      WHERE c.type = 'PRIVATE'
      LIMIT 1
    `;
    
    const results = await sequelize.query(query, {
      replacements: { userId1, userId2 },
      type: Sequelize.QueryTypes.SELECT
    });
    
    // If we found an existing conversation
    if (results && results.length > 0 && results[0].id) {
      const existingId = results[0].id;
      console.log(`Found existing conversation: ${existingId}`);
      
      // Return the conversation with full member details
      return await Conversation.findOne({
        where: { id: existingId },
        include: [{ 
          model: User, 
          as: "members",
          attributes: ["id", "username", "fullname", "avatar", "status"]
        }]
      });
    }

    console.log("No existing conversation found, creating a new one");
    // Create new conversation
    const conversation = await Conversation.create({
      id: uuidv4(),
      type: "PRIVATE"
    });
    console.log(`Created new conversation with ID: ${conversation.id}`);

    // Create the conversation members entries
    console.log("Creating conversation_members entries");
    await ConversationMember.bulkCreate([
      { userId: userId1, conversationId: conversation.id, role: "MEMBER" },
      { userId: userId2, conversationId: conversation.id, role: "MEMBER" }
    ]);

    // Return the conversation with members included
    console.log("Fetching complete conversation with members");
    return await Conversation.findOne({
      where: { id: conversation.id },
      include: [{ 
        model: User, 
        as: "members",
        attributes: ["id", "username", "fullname", "avatar", "status"]
      }]
    });
  } catch (error) {
    console.error("Error creating private conversation:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to create private conversation: ${error.message}`, 500);
  }
};

exports.createGroupConversation = async (
  name,
  userIds,
  creatorId,
  avatar = null
) => {
  try {
    // Create new conversation
    const conversation = await Conversation.create({
      id: uuidv4(),
      name,
      type: "GROUP",
      avatar,
    });

    // Create member entries
    const members = userIds.map((userId) => ({
      userId,
      conversationId: conversation.id,
      role: userId === creatorId ? "CREATOR" : "MEMBER",
    }));
    
    await ConversationMember.bulkCreate(members);

    // Return the conversation with members included
    return await Conversation.findOne({
      where: { id: conversation.id },
      include: [
        { 
          model: User, 
          as: "members",
          attributes: ["id", "username", "fullname", "avatar", "status"]
        }
      ]
    });
  } catch (error) {
    console.error("Error creating group conversation:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to create group conversation: ${error.message}`, 500);
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

/**
 * Get recent conversations with their last message
 * @param {string} userId - ID of the user
 * @returns {Array} List of conversations with their last message
 */
exports.getRecentConversations = async (userId) => {
  try {
    // Get all conversations the user is a member of
    const conversations = await Conversation.findAll({
      include: [
        { 
          model: User, 
          as: "members", 
          attributes: ["id", "username", "fullname", "avatar", "status"],
          through: { attributes: ["role"] }
        }
      ],
      where: {
        "$members.id$": userId
      }
    });

    // For each conversation, get the last message
    const results = await Promise.all(conversations.map(async (conversation) => {
      const lastMessage = await Message.findOne({
        where: { conversationId: conversation.id },
        order: [["created_at", "DESC"]],
        limit: 1,
        include: [
          {
            model: User,
            as: "senderUser", // Match the association name defined in models/index.js
            attributes: ["id", "username", "fullname"]
          }
        ]
      });
      
      // Count unread messages for this user
      const unreadCount = await Message.count({
        where: { 
          conversationId: conversation.id,
          read: false,
          sender: { [Op.ne]: userId }
        }
      });
      
      // Filter out the current user from members
      const otherMembers = conversation.members.filter(
        member => member.id !== userId
      );
      
      // For private chats, we want the other user's info
      const conversationName = conversation.type === "PRIVATE" && !conversation.name && otherMembers.length > 0
        ? otherMembers[0].fullname
        : conversation.name;
        
      const conversationAvatar = conversation.type === "PRIVATE" && !conversation.avatar && otherMembers.length > 0
        ? otherMembers[0].avatar 
        : conversation.avatar;

      // Find the member role for the current user
      let userRole = "MEMBER";
      const userMember = conversation.members.find(m => m.id === userId);
      if (userMember && userMember.ConversationMember) {
        userRole = userMember.ConversationMember.role;
      }
      
      return {
        id: conversation.id,
        name: conversationName,
        avatar: conversationAvatar,
        type: conversation.type,
        created_at: conversation.created_at,
        members: conversation.members,
        lastMessage: lastMessage,
        unreadCount: unreadCount,
        userRole: userRole
      };
    }));
    
    // Sort by most recent message first
    return results.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at);
    });
  } catch (error) {
    console.error("Error fetching recent conversations:", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch recent conversations: " + error.message, 500);
  }
};

/**
 * Set nickname for a private conversation
 * @param {string} conversationId - ID of the conversation
 * @param {string} userId - ID of the user setting the nickname
 * @param {string} nickname - New nickname for the conversation
 * @returns {Object} Updated conversation
 */
exports.setConversationNickname = async (conversationId, userId, nickname) => {
  try {
    // Verify user is a member of this conversation
    const memberCheck = await ConversationMember.findOne({
      where: { userId, conversationId }
    });
    
    if (!memberCheck) {
      throw new ForbiddenError("You are not a member of this conversation");
    }
    
    // Get conversation
    const conversation = await Conversation.findOne({
      where: { id: conversationId }
    });
    
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }
    
    // Set the nickname
    conversation.name = nickname;
    await conversation.save();
    
    return conversation;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to set conversation nickname", 500);
  }
};

/**
 * Clear all messages in a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {string} userId - ID of the user clearing messages
 * @returns {Object} Result with deleted count
 */
exports.clearChatHistory = async (conversationId, userId) => {
  try {
    // Verify user is a member of this conversation
    const memberCheck = await ConversationMember.findOne({
      where: { userId, conversationId }
    });
    
    if (!memberCheck) {
      throw new ForbiddenError("You are not a member of this conversation");
    }
    
    // For group chats, only creator or admin can clear history
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }
    
    if (conversation.type === "GROUP" && 
        !["CREATOR", "ADMIN"].includes(memberCheck.role)) {
      throw new ForbiddenError("Only group admins can clear chat history");
    }
    
    // Delete all messages
    const { count } = await Message.destroy({
      where: { conversationId }
    });
    
    // Create a system message indicating history was cleared
    await exports.createSystemMessage(
      conversationId,
      `Chat history was cleared by a user`,
      "HISTORY_CLEARED"
    );
    
    return { deletedCount: count };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to clear chat history", 500);
  }
};

/**
 * Leave a group conversation
 * @param {string} conversationId - ID of the conversation
 * @param {string} userId - ID of the user leaving the group
 * @returns {Object} Result of the operation
 */
exports.leaveGroup = async (conversationId, userId) => {
  try {
    // Verify conversation exists and is a group
    const conversation = await Conversation.findOne({
      where: { id: conversationId, type: "GROUP" }
    });
    
    if (!conversation) {
      throw new NotFoundError("Group conversation not found");
    }
    
    // Verify user is a member
    const member = await ConversationMember.findOne({
      where: { userId, conversationId }
    });
    
    if (!member) {
      throw new NotFoundError("You are not a member of this group");
    }
    
    // If user is the creator (and last admin), check if there are other admins
    if (member.role === "CREATOR") {
      const adminCount = await ConversationMember.count({
        where: { 
          conversationId,
          role: { [Op.in]: ["CREATOR", "ADMIN"] }
        }
      });
      
      if (adminCount === 1) {
        // Find the member who's been in the group the longest to promote
        const oldestMember = await ConversationMember.findOne({
          where: { 
            conversationId,
            userId: { [Op.ne]: userId },
            role: "MEMBER"
          },
          order: [["created_at", "ASC"]],
          limit: 1
        });
        
        if (oldestMember) {
          // Promote to admin
          oldestMember.role = "CREATOR";
          await oldestMember.save();
          
          // Create system message about new admin
          await exports.createSystemMessage(
            conversationId,
            `A new group admin has been assigned.`,
            "ADMIN_ASSIGNED"
          );
        }
      }
    }
    
    // Get user info for the system message
    const user = await User.findByPk(userId, {
      attributes: ["username"]
    });
    
    // Remove the user from the group
    await ConversationMember.destroy({
      where: { userId, conversationId }
    });
    
    // Create system message
    await exports.createSystemMessage(
      conversationId,
      `${user.username} has left the group.`,
      "USER_LEFT"
    );
    
    return { success: true };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to leave group", 500);
  }
};

/**
 * Delete a group conversation (creators only)
 * @param {string} conversationId - ID of the conversation
 * @param {string} userId - ID of the user requesting deletion
 * @returns {Object} Result of the operation
 */
exports.deleteGroup = async (conversationId, userId) => {
  try {
    // Verify conversation exists and is a group
    const conversation = await Conversation.findOne({
      where: { id: conversationId, type: "GROUP" }
    });
    
    if (!conversation) {
      throw new NotFoundError("Group conversation not found");
    }
    
    // Verify user is the creator
    const member = await ConversationMember.findOne({
      where: { userId, conversationId, role: "CREATOR" }
    });
    
    if (!member) {
      throw new ForbiddenError("Only the group creator can delete the group");
    }
    
    // Get all members for notifications
    const members = await ConversationMember.findAll({
      where: { conversationId },
      attributes: ["userId"]
    });
    
    const memberIds = members.map(m => m.userId);
    
    // Delete all messages
    await Message.destroy({
      where: { conversationId }
    });
    
    // Delete all members
    await ConversationMember.destroy({
      where: { conversationId }
    });
    
    // Delete the conversation
    await conversation.destroy();
    
    return { 
      success: true,
      message: "Group deleted successfully",
      affectedUsers: memberIds
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to delete group", 500);
  }
};

/**
 * Add members to a group conversation
 * @param {string} conversationId - ID of the group conversation
 * @param {string} userId - ID of the user adding new members
 * @param {Array} memberIds - Array of user IDs to add to the group
 * @returns {Object} Result with added members
 */
exports.addGroupMembers = async (conversationId, userId, memberIds) => {
  try {
    // Verify conversation exists and is a group
    const conversation = await Conversation.findOne({
      where: { id: conversationId, type: "GROUP" },
      include: [
        { 
          model: User, 
          as: "members", 
          attributes: ["id", "username", "fullname"]
        }
      ]
    });
    
    if (!conversation) {
      throw new NotFoundError("Group conversation not found");
    }
    
    // Verify user is a member with permission to add (admin or creator)
    const currentMember = await ConversationMember.findOne({
      where: { 
        userId, 
        conversationId,
        role: { [Op.in]: ["CREATOR", "ADMIN"] }
      }
    });
    
    if (!currentMember) {
      throw new ForbiddenError("You don't have permission to add members to this group");
    }
    
    // Get existing member IDs to avoid duplicates
    const existingMemberIds = conversation.members.map(m => m.id);
    
    // Filter out users who are already members
    const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id));
    
    if (newMemberIds.length === 0) {
      return { 
        success: false, 
        message: "All users are already members of this group",
        addedMembers: []
      };
    }
    
    // Verify all users to be added exist
    const usersToAdd = await User.findAll({
      where: { id: { [Op.in]: newMemberIds } },
      attributes: ["id", "username", "fullname", "avatar"]
    });
    
    if (usersToAdd.length !== newMemberIds.length) {
      throw new NotFoundError("One or more users not found");
    }
    
    // Add members to the group
    const newMembers = usersToAdd.map(user => ({
      userId: user.id,
      conversationId,
      role: "MEMBER"
    }));
    
    await ConversationMember.bulkCreate(newMembers);
    
    // Create system message about new members
    const usernames = usersToAdd.map(u => u.username).join(", ");
    const addedBy = await User.findByPk(userId, { 
      attributes: ["username"]
    });
    
    await exports.createSystemMessage(
      conversationId,
      `${addedBy.username} added ${usernames} to the group.`,
      "MEMBERS_ADDED"
    );
    
    return { 
      success: true, 
      message: `${usersToAdd.length} members added successfully`,
      addedMembers: usersToAdd
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to add members: ${error.message}`, 500);
  }
};

/**
 * Remove a member from a group conversation
 * @param {string} conversationId - ID of the group conversation
 * @param {string} adminId - ID of the admin removing the member
 * @param {string} memberIdToRemove - ID of the user to remove
 * @returns {Object} Result of the operation
 */
exports.removeGroupMember = async (conversationId, adminId, memberIdToRemove) => {
  try {
    // Verify conversation exists and is a group
    const conversation = await Conversation.findOne({
      where: { id: conversationId, type: "GROUP" }
    });
    
    if (!conversation) {
      throw new NotFoundError("Group conversation not found");
    }
    
    // Verify admin is a member with permission to remove (admin or creator)
    const adminMember = await ConversationMember.findOne({
      where: { 
        userId: adminId, 
        conversationId,
        role: { [Op.in]: ["CREATOR", "ADMIN"] }
      }
    });
    
    if (!adminMember) {
      throw new ForbiddenError("You don't have permission to remove members from this group");
    }
    
    // Verify the member to remove exists
    const memberToRemove = await ConversationMember.findOne({
      where: { userId: memberIdToRemove, conversationId }
    });
    
    if (!memberToRemove) {
      throw new NotFoundError("User is not a member of this group");
    }
    
    // Prevent removing the creator
    if (memberToRemove.role === "CREATOR" && memberIdToRemove !== adminId) {
      throw new ForbiddenError("You cannot remove the group creator");
    }
    
    // Get user info for the system message
    const [adminUser, removedUser] = await Promise.all([
      User.findByPk(adminId, { attributes: ["username"] }),
      User.findByPk(memberIdToRemove, { attributes: ["username", "id"] })
    ]);
    
    // Remove the member
    await memberToRemove.destroy();
    
    // Create system message
    let message;
    if (adminId === memberIdToRemove) {
      message = `${adminUser.username} left the group.`;
    } else {
      message = `${adminUser.username} removed ${removedUser.username} from the group.`;
    }
    
    await exports.createSystemMessage(
      conversationId,
      message,
      "MEMBER_REMOVED"
    );
    
    return { 
      success: true, 
      message: adminId === memberIdToRemove ? 
        "You left the group" : 
        `${removedUser.username} was removed from the group`,
      removedMember: removedUser
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to remove member: ${error.message}`, 500);
  }
};

/**
 * Get all conversations for a user (simpler version)
 * @param {string} userId - ID of the user
 * @returns {Array} List of conversations
 */
exports.getUserConversations = async (userId) => {
  try {
    // Get all conversations the user is a member of
    const conversations = await Conversation.findAll({
      include: [
        { 
          model: User, 
          as: "members", 
          attributes: ["id", "username", "fullname", "avatar", "status"],
          through: { attributes: ["role"] }
        }
      ],
      where: {
        "$members.id$": userId
      }
    });

    // Format the result with necessary information
    const results = conversations.map(conversation => {
      // Filter out the current user from members
      const otherMembers = conversation.members.filter(
        member => member.id !== userId
      );
      
      // For private chats, we want the other user's info
      const conversationName = conversation.type === "PRIVATE" && !conversation.name && otherMembers.length > 0
        ? otherMembers[0].fullname
        : conversation.name;
        
      const conversationAvatar = conversation.type === "PRIVATE" && !conversation.avatar && otherMembers.length > 0
        ? otherMembers[0].avatar 
        : conversation.avatar;
      
      // Find user's role in this conversation
      const userMember = conversation.members.find(m => m.id === userId);
      const userRole = userMember && userMember.ConversationMember ? 
        userMember.ConversationMember.role : "MEMBER";

      return {
        id: conversation.id,
        name: conversationName,
        avatar: conversationAvatar,
        type: conversation.type,
        created_at: conversation.created_at,
        members: conversation.members.map(m => ({
          id: m.id,
          username: m.username,
          fullname: m.fullname,
          avatar: m.avatar,
          status: m.status,
          role: m.ConversationMember?.role || "MEMBER"
        })),
        userRole
      };
    });
    
    return results;
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to fetch user conversations: ${error.message}`, 500);
  }
};
