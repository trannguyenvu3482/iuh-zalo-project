const userService = require("../services/user.service");
const { UnauthorizedError } = require("../exceptions/errors");
const { successResponse } = require("../utils/response");
const fileUpload = require("../middleware/fileUpload");

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
    const user = await userService.getUserById(userId, queryId);
    successResponse(res, "User fetched successfully", user);
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

    successResponse(res, "Profile updated successfully", {
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      phoneNumber: updatedUser.phoneNumber,
      gender: updatedUser.gender,
      birthdate: updatedUser.birthdate,
      avatar: updatedUser.avatar,
      banner: updatedUser.banner,
      status: updatedUser.status,
    });
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

      successResponse(res, "Avatar updated successfully", {
        id: updatedUser.id,
        avatar: updatedUser.avatar,
      });
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

      successResponse(res, "Banner updated successfully", {
        id: updatedUser.id,
        banner: updatedUser.banner,
      });
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

    successResponse(res, "Status updated successfully", {
      id: updatedUser.id,
      status: updatedUser.status,
    });
  } catch (error) {
    next(error);
  }
};
