const userService = require("../services/user.service");
const { UnauthorizedError, NotFoundError } = require("../exceptions/errors");
const { successResponse } = require("../utils/response");
const fileUpload = require("../middleware/fileUpload");
const { User, Friendship } = require("../models");
const { Op } = require("sequelize");

// Socket.io instance
let io;

// Function to set Socket.io instance
const setIo = (socketIo) => {
  io = socketIo;
};

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

exports.searchUserByPhone = async (req, res, next) => {
  const { phoneNumber } = req.query;
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const result = await userService.searchUserByPhone(phoneNumber, userId);
    successResponse(res, "User fetched successfully", result);
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  const { queryId } = req.params;
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");

    // Get the user data from database
    const user = await User.findByPk(queryId, {
      attributes: [
        "id",
        "phoneNumber",
        "fullName",
        "avatar",
        "banner",
        "status",
        "gender",
        "birthdate",
        "created_at",
        "updated_at",
      ],
    });

    if (!user) throw new NotFoundError("User not found");

    // Check if this is the current user
    const isCurrentUser = user.id === userId;

    // Only check friend status if not viewing own profile
    let isFriend = false;
    if (!isCurrentUser) {
      const friendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { userId, friendId: user.id, status: "ACCEPTED" },
            { userId: user.id, friendId: userId, status: "ACCEPTED" },
          ],
        },
      });
      isFriend = !!friendship;
    }

    successResponse(res, "User fetched successfully", {
      user,
      isFriend,
      isCurrentUser,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyProfile = async (req, res, next) => {
  const userId = req?.userId;

  try {
    const user = await userService.getMyProfile(userId);
    successResponse(res, "User fetched successfully", user);
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  const userId = req?.userId;

  try {
    const users = await userService.getAllUsers(userId);
    successResponse(res, "Users fetched successfully", users);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile information
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) throw new UnauthorizedError("Authentication required");

    const { fullName, gender, birthdate, phoneNumber } = req.body;

    const updatedUser = await userService.updateUserProfile(userId, {
      fullName,
      gender,
      birthdate,
      phoneNumber,
    });

    const userData = {
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      phoneNumber: updatedUser.phoneNumber,
      gender: updatedUser.gender,
      birthdate: updatedUser.birthdate,
      avatar: updatedUser.avatar,
      banner: updatedUser.banner,
      status: updatedUser.status,
    };

    // Emit socket event for profile update if Socket.io is available
    if (io) {
      io.to(`user_${userId}`).emit("user:profile_updated", {
        user: userData,
        timestamp: new Date().toISOString(),
      });
    }

    successResponse(res, "Profile updated successfully", userData);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user avatar
 */
exports.updateAvatar = [
  fileUpload.avatarUpload.single("avatar"),
  async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      if (!req.file) {
        return res.status(400).json({
          statusCode: 0,
          message: "No avatar image uploaded",
        });
      }

      const updatedUser = await userService.updateUserAvatar(userId, req.file);

      const userData = {
        id: updatedUser.id,
        avatar: updatedUser.avatar,
      };

      // Emit socket event for avatar update if Socket.io is available
      if (io) {
        io.to(`user_${userId}`).emit("user:profile_updated", {
          user: userData,
          timestamp: new Date().toISOString(),
        });
      }

      successResponse(res, "Avatar updated successfully", userData);
    } catch (error) {
      next(error);
    }
  },
];

/**
 * Update user banner
 */
exports.updateBanner = [
  fileUpload.bannerUpload.single("banner"),
  async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      if (!req.file) {
        return res.status(400).json({
          statusCode: 0,
          message: "No banner image uploaded",
        });
      }

      const updatedUser = await userService.updateUserBanner(userId, req.file);

      const userData = {
        id: updatedUser.id,
        banner: updatedUser.banner,
      };

      // Emit socket event for banner update if Socket.io is available
      if (io) {
        io.to(`user_${userId}`).emit("user:profile_updated", {
          user: userData,
          timestamp: new Date().toISOString(),
        });
      }

      successResponse(res, "Banner updated successfully", userData);
    } catch (error) {
      next(error);
    }
  },
];

/**
 * Update user status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) throw new UnauthorizedError("Authentication required");

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        statusCode: 0,
        message: "Status is required",
      });
    }

    const updatedUser = await userService.updateUserStatus(userId, status);

    const userData = {
      id: updatedUser.id,
      status: updatedUser.status,
    };

    // Emit socket event for status update if Socket.io is available
    if (io) {
      io.to(`user_${userId}`).emit("user:profile_updated", {
        user: userData,
        timestamp: new Date().toISOString(),
      });
    }

    successResponse(res, "Status updated successfully", userData);
  } catch (error) {
    next(error);
  }
};

/**
 * Search for a user by phone number (public endpoint, no authentication required)
 */
exports.searchUserByPhonePublic = async (req, res, next) => {
  const { phoneNumber } = req.query;

  try {
    if (!phoneNumber) {
      return res.status(400).json({
        statusCode: 0,
        message: "Phone number is required",
      });
    }

    const user = await userService.searchUserByPhonePublic(phoneNumber);

    if (!user) {
      return res.status(200).json({
        statusCode: 1,
        message: "Phone number is available",
        data: null,
      });
    }

    successResponse(res, "User found", user);
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) throw new UnauthorizedError("Authentication required");

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        statusCode: 0,
        message: "Old password and new password are required",
      });
    }

    const updatedUser = await userService.changePassword(
      userId,
      oldPassword,
      newPassword
    );

    successResponse(res, "Password changed successfully", {
      id: updatedUser.id,
    });
  } catch (error) {
    next(error);
  }
};

// Export the setIo function
exports.setIo = setIo;
