const { Op } = require("sequelize");
const { User, Friendship } = require("../models");
const {
  ValidationError,
  NotFoundError,
  AppError,
} = require("../exceptions/errors");
const bcrypt = require("bcryptjs");

exports.searchUserByPhone = async (phoneNumber, userId) => {
  try {
    const user = await User.findOne({
      where: { phoneNumber },
      attributes: ["id", "phoneNumber", "fullName", "avatar"],
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
      attributes: [
        "id",
        "phoneNumber",
        "fullName",
        "avatar",
        "banner",
        "status",
      ],
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
      attributes: [
        "id",
        "phoneNumber",
        "fullName",
        "gender",
        "birthdate",
        "avatar",
        "banner",
        "status",
        "created_at",
        "updated_at",
      ],
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
      attributes: ["id", "phoneNumber", "fullName", "avatar", "status"],
    });
    if (!users) throw new NotFoundError("User not found");

    return users;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get user", 500);
  }
};

/**
 * Update user profile
 * @param {string} userId - UUID of the user to update
 * @param {Object} profileData - New profile data
 * @returns {Object} Updated user
 */
exports.updateUserProfile = async (userId, profileData) => {
  const { fullName, gender, birthdate, phoneNumber } = profileData;

  // Find the user
  const user = await User.findOne({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Validate phoneNumber uniqueness if changed
  if (phoneNumber && phoneNumber !== user.phoneNumber) {
    const existingPhone = await User.findOne({ where: { phoneNumber } });
    if (existingPhone) {
      throw new ValidationError("Phone number is already in use");
    }
  }

  // Update user data
  user.fullName = fullName || user.fullName;
  user.gender = gender || user.gender;
  user.birthdate = birthdate || user.birthdate;
  user.phoneNumber = phoneNumber || user.phoneNumber;

  // Save changes
  await user.save();

  return user;
};

/**
 * Update user status
 * @param {string} userId - UUID of the user to update
 * @param {string} status - New status (active or inactive)
 * @returns {Object} Updated user
 */
exports.updateUserStatus = async (userId, status) => {
  if (!["active", "inactive"].includes(status)) {
    throw new ValidationError("Invalid status. Must be 'active' or 'inactive'");
  }

  const user = await User.findOne({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  user.status = status;
  await user.save();

  return user;
};

/**
 * Update user avatar
 * @param {string} userId - UUID of the user to update
 * @param {Object} file - Uploaded file object
 * @returns {Object} Updated user
 */
exports.updateUserAvatar = async (userId, file) => {
  try {
    const supabaseStorage = require("../utils/supabase");
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!file) {
      throw new ValidationError("No avatar file provided");
    }

    // Check if user already has an avatar that's not the default
    if (user.avatar && !user.avatar.includes("default-avatar")) {
      // Get the file path from the URL
      const existingPath = supabaseStorage.getPathFromUrl(
        user.avatar,
        "avatars"
      );

      if (existingPath) {
        // Delete the old avatar
        try {
          await supabaseStorage.deleteFile(existingPath, "avatars");
        } catch (error) {
          console.warn(`Failed to delete old avatar: ${error.message}`);
          // Continue with upload even if deletion fails
        }
      }
    }

    // Upload the new avatar to Supabase
    const result = await supabaseStorage.uploadFile(
      file.buffer,
      file.originalname,
      "avatars",
      "users",
      file.mimetype
    );

    // Update user with new avatar URL
    user.avatar = result.url;
    await user.save();

    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to update avatar: ${error.message}`, 500);
  }
};

/**
 * Update user banner
 * @param {string} userId - UUID of the user to update
 * @param {Object} file - Uploaded file object
 * @returns {Object} Updated user
 */
exports.updateUserBanner = async (userId, file) => {
  try {
    const supabaseStorage = require("../utils/supabase");
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!file) {
      throw new ValidationError("No banner file provided");
    }

    // Check if user already has a banner that's not the default
    if (user.banner && !user.banner.includes("default-banner")) {
      // Get the file path from the URL
      const existingPath = supabaseStorage.getPathFromUrl(
        user.banner,
        "banners"
      );

      if (existingPath) {
        // Delete the old banner
        try {
          await supabaseStorage.deleteFile(existingPath, "banners");
        } catch (error) {
          console.warn(`Failed to delete old banner: ${error.message}`);
          // Continue with upload even if deletion fails
        }
      }
    }

    // Upload the new banner to Supabase
    const result = await supabaseStorage.uploadFile(
      file.buffer,
      file.originalname,
      "banners",
      "users",
      file.mimetype
    );

    // Update user with new banner URL
    user.banner = result.url;
    await user.save();

    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to update banner: ${error.message}`, 500);
  }
};

/**
 * Search for a user by phone number without authentication
 * @param {string} phoneNumber - Phone number to search for
 * @returns {Promise<Object|null>} User object if found, null otherwise
 */
exports.searchUserByPhonePublic = async (phoneNumber) => {
  try {
    const user = await User.findOne({
      where: { phoneNumber },
      attributes: ["id", "phoneNumber", "fullName", "avatar", "status"],
    });
    return user;
  } catch (error) {
    throw new AppError("Error searching user by phone", 500);
  }
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Updated user object
 */
exports.changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("Tài khoản không tồn tại", 404);
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError("Mật khẩu cũ không đúng", 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({ password: hashedPassword });

    return user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Lỗi khi đổi mật khẩu", 500);
  }
};
