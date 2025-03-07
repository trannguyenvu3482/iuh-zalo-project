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
    if (existingFriendship) {
      if (existingFriendship.status === "PENDING") {
        throw new ValidationError("Friend request already exists");
      } else if (existingFriendship.status === "ACCEPTED") {
        throw new ValidationError("User is already a friend");
      }
    }

    const friendship = await Friendship.create({
      userId,
      friendId: friend.id,
      status: "PENDING",
    });

    return friendship;
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
          attributes: ["id", "username", "phoneNumber"],
        }, // Changed from 'friends' to 'friend'
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "phoneNumber"],
        }, // Include initiator too
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
