const { Op } = require("sequelize");
const { User, Friendship } = require("../models");
const {
  ValidationError,
  NotFoundError,
  AppError,
} = require("../exceptions/errors");

exports.addFriend = async (userId, friendId) => {
  try {
    const friend = await User.findByPk(friendId);
    if (!friend) throw new NotFoundError("User not found");
    if (userId === friend.id)
      throw new ValidationError("Cannot add yourself as a friend");

    const existingFriendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId, friendId: friend.id },
          { userId: friend.id, friendId: userId },
        ],
      },
    });
    if (existingFriendship && existingFriendship.status !== "REJECTED") {
      if (existingFriendship.status === "PENDING") {
        throw new ValidationError("Friend request already exists");
      } else if (existingFriendship.status === "ACCEPTED") {
        throw new ValidationError("User is already a friend");
      }
    } else if (existingFriendship && existingFriendship.status === "REJECTED") {
      existingFriendship.status = "PENDING";
      const updatedFriendship = await existingFriendship.save();
      return updatedFriendship;
    } else {
      const friendship = await Friendship.create({
        userId,
        friendId: friend.id,
        status: "PENDING",
      });
      return friendship;
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to add friend", 500);
  }
};

exports.acceptFriend = async (userId, friendId) => {
  try {
    const friendship = await Friendship.findOne({
      where: { userId: friendId, friendId: userId, status: "PENDING" },
    });

    if (!friendship) throw new NotFoundError("No pending friend request found");

    friendship.status = "ACCEPTED";
    await friendship.save();

    return friendship;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to accept friend", 500);
  }
};

exports.getFriendList = async (userId) => {
  try {
    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { userId, status: "ACCEPTED" },
          { friendId: userId, status: "ACCEPTED" },
        ],
      },
      include: [
        {
          model: User,
          as: "friend",
          attributes: ["id", "phoneNumber", "fullName", "avatar", "status"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "phoneNumber", "fullName", "avatar", "status"],
        },
      ],
    });

    // Map to return the friend (not the user themselves)
    return friendships
      .map((f) => {
        if (f.userId === userId) return f.friend; // Return the friend if userId matches
        if (f.friendId === userId) return f.user; // Return the user if friendId matches
        return null;
      })
      .filter((f) => f !== null);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch friend list", 500);
  }
};

exports.getMyFriendRequests = async (userId) => {
  const friendRequests = await Friendship.findAll({
    where: { friendId: userId, status: "PENDING" },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "phoneNumber", "avatar"],
      },
    ],
  });
  return friendRequests;
};

/**
 * Reject a friend request
 * @param {string} userId - ID of user rejecting the request
 * @param {string} friendId - ID of user who sent the request
 * @returns {Object} Updated friendship record
 */
exports.rejectFriend = async (userId, friendId) => {
  try {
    const friendship = await Friendship.findOne({
      where: { userId: friendId, friendId: userId, status: "PENDING" },
    });

    if (!friendship) throw new NotFoundError("No pending friend request found");

    friendship.status = "REJECTED";
    await friendship.save();

    return friendship;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to reject friend request", 500);
  }
};

/**
 * Remove a friend (unfriend)
 * @param {string} userId - ID of user initiating the unfriend
 * @param {string} friendId - ID of friend to remove
 * @returns {boolean} Success status
 */
exports.removeFriend = async (userId, friendId) => {
  try {
    const friendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId, friendId, status: "ACCEPTED" },
          { userId: friendId, friendId: userId, status: "ACCEPTED" },
        ],
      },
    });

    if (!friendship) throw new NotFoundError("Friend relationship not found");

    // Delete the friendship record
    await friendship.destroy();

    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to remove friend", 500);
  }
};

/**
 * Cancel a sent friend request
 * @param {string} userId - ID of user who sent the request
 * @param {string} friendId - ID of user who received the request
 * @returns {boolean} Success status
 */
exports.cancelFriendRequest = async (userId, friendId) => {
  try {
    const friendship = await Friendship.findOne({
      where: {
        userId,
        friendId,
        status: "PENDING",
      },
    });

    if (!friendship) throw new NotFoundError("Friend request not found");

    // Delete the pending request
    await friendship.destroy();

    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to cancel friend request", 500);
  }
};

/**
 * Get sent friend requests that are still pending
 * @param {string} userId - ID of user who sent the requests
 * @returns {Array} List of sent friend requests
 */
exports.getSentFriendRequests = async (userId) => {
  try {
    const sentRequests = await Friendship.findAll({
      where: {
        userId,
        status: "PENDING",
      },
      include: [
        {
          model: User,
          as: "friend",
          attributes: ["id", "phoneNumber", "fullName", "avatar"],
        },
      ],
    });

    return sentRequests;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get sent friend requests", 500);
  }
};

/**
 * Get friendship status between two users
 * @param {string} userId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @returns {Object} Friendship status information
 */
exports.getFriendshipStatus = async (userId, otherUserId) => {
  try {
    if (userId === otherUserId) {
      return { status: "SELF" };
    }

    // Check if there's an existing friendship record
    const friendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId, friendId: otherUserId },
          { userId: otherUserId, friendId: userId },
        ],
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "phoneNumber", "fullName", "avatar"],
        },
        {
          model: User,
          as: "friend",
          attributes: ["id", "phoneNumber", "fullName", "avatar"],
        },
      ],
    });

    if (!friendship) {
      return { status: "NOT_FRIENDS" };
    }

    // Determine the request direction and status
    if (friendship.status === "ACCEPTED") {
      return { status: "FRIENDS", friendship };
    } else if (friendship.status === "PENDING") {
      if (friendship.userId === userId) {
        return { status: "REQUEST_SENT", friendship };
      } else {
        return {
          status: "REQUEST_RECEIVED",
          friendship,
          requestId: friendship.id,
        };
      }
    } else if (friendship.status === "REJECTED") {
      return { status: "REQUEST_REJECTED", friendship };
    }

    return { status: "UNKNOWN" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get friendship status", 500);
  }
};

/**
 * Get friend suggestions (friends of friends)
 * @param {string} userId - Current user ID
 * @param {number} limit - Maximum number of suggestions to return
 * @returns {Array} List of suggested users
 */
exports.getFriendSuggestions = async (userId, limit = 10) => {
  try {
    const { User, Friendship, sequelize } = require("../models");

    // Get current user's friends
    const myFriendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { userId, status: "ACCEPTED" },
          { friendId: userId, status: "ACCEPTED" },
        ],
      },
    });

    // Extract friend IDs
    const myFriendIds = myFriendships.map((f) =>
      f.userId === userId ? f.friendId : f.userId
    );

    // If user has no friends, return random users
    if (myFriendIds.length === 0) {
      return await User.findAll({
        where: {
          id: { [Op.ne]: userId },
        },
        limit,
        attributes: ["id", "phoneNumber", "fullName", "avatar"],
        order: sequelize.random(),
      });
    }

    // Find friends of friends
    const friendsOfFriends = await Friendship.findAll({
      where: {
        status: "ACCEPTED",
        [Op.or]: [
          { userId: { [Op.in]: myFriendIds } },
          { friendId: { [Op.in]: myFriendIds } },
        ],
        [Op.and]: [
          {
            [Op.or]: [
              { userId: { [Op.notIn]: [userId, ...myFriendIds] } },
              { friendId: { [Op.notIn]: [userId, ...myFriendIds] } },
            ],
          },
        ],
      },
      include: [
        {
          model: User,
          as: "friend",
          attributes: ["id", "phoneNumber", "fullName", "avatar"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "phoneNumber", "fullName", "avatar"],
        },
      ],
    });

    // Extract unique suggestions
    const suggestions = new Map();

    friendsOfFriends.forEach((f) => {
      // Get the user who is not in my friend list
      let suggestion;
      if (myFriendIds.includes(f.userId)) {
        suggestion = f.friend;
      } else if (myFriendIds.includes(f.friendId)) {
        suggestion = f.user;
      }

      // Only add if not the current user and not already in suggestions
      if (
        suggestion &&
        suggestion.id !== userId &&
        !suggestions.has(suggestion.id)
      ) {
        suggestions.set(suggestion.id, {
          ...suggestion.toJSON(),
          mutualFriends: 1,
        });
      } else if (suggestion && suggestions.has(suggestion.id)) {
        // Increment mutual friends count
        const existing = suggestions.get(suggestion.id);
        suggestions.set(suggestion.id, {
          ...existing,
          mutualFriends: existing.mutualFriends + 1,
        });
      }
    });

    // Convert to array and sort by number of mutual friends
    return Array.from(suggestions.values())
      .sort((a, b) => b.mutualFriends - a.mutualFriends)
      .slice(0, limit);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get friend suggestions", 500);
  }
};
