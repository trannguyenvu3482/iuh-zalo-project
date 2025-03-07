const { Op } = require("sequelize");
const { User, Friendship } = require("../models");
const {
  ValidationError,
  NotFoundError,
  AppError,
} = require("../exceptions/errors");

exports.searchUserByPhone = async (phoneNumber, userId) => {
  try {
    const user = await User.findOne({
      where: { phoneNumber },
      attributes: ["id", "username", "phoneNumber"],
    });
    if (!user) throw new NotFoundError("User not found");
    if (user.id === userId) throw new ValidationError("Cannot search yourself");

    const isFriend = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId, friendId: user.id, status: "ACCEPTED" },
          { userId: user.id, friendId: userId, status: "ACCEPTED" },
        ],
      },
    });

    return { user, isFriend: !!isFriend };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to search user", 500);
  }
};

exports.getUserById = async (userId, queryId) => {
  try {
    const user = await User.findByPk(queryId, {
      attributes: ["id", "username", "phoneNumber", "fullname", "email"],
    });
    if (!user) throw new NotFoundError("User not found");
    if (user.id === userId) throw new ValidationError("Cannot search yourself");

    const isFriend = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId, friendId: user.id, status: "ACCEPTED" },
          { userId: user.id, friendId: userId, status: "ACCEPTED" },
        ],
      },
    });

    return { user, isFriend: !!isFriend };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get user", 500);
  }
};

exports.getMyProfile = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ["id", "username", "phoneNumber", "fullname", "email"],
    });
    if (!user) throw new NotFoundError("User not found");

    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get user", 500);
  }
};

exports.getAllUsers = async (userId) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "phoneNumber", "fullname", "email"],
    });
    if (!users) throw new NotFoundError("User not found");

    return users;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get user", 500);
  }
};
