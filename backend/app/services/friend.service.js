const { Op } = require("sequelize");
const { User, Friendship } = require("../models");
const {
  ValidationError,
  NotFoundError,
  AppError,
} = require("../exceptions/errors");

exports.addFriend = async (userId, friendPhoneNumber) => {
  try {
    if (!friendPhoneNumber)
      throw new ValidationError("Phone number is required");
    const friend = await User.findOne({
      where: { phoneNumber: friendPhoneNumber },
    });
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
    if (existingFriendship)
      throw new ValidationError(
        "Friend request already exists or user is already a friend"
      );

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
          as: "friends",
          attributes: ["id", "username", "phoneNumber"],
        },
      ],
    });

    return friendships.map((f) =>
      f.userId === userId ? f.friend : f.userId === userId ? null : f.friend
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch friend list", 500);
  }
};
