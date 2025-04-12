const db = require("../models");
const config = require("../config/auth.config");
const { User } = require("../models");
const { Op } = require("sequelize");
const QRCode = require("qrcode");
const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { assignRolesToUser } = require("../services/auth.service");
const { successResponse } = require("../utils/response");
const authService = require("../services/auth.service");
const {
  getUserEnvironment,
  getUserPlatform,
} = require("../utils/formatUserAgent");
const { ValidationError, AppError } = require("../exceptions/errors");
const otpService = require("../services/otp.service");

const pendingLogins = {};

/**
 * Request OTP for phone number verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.requestOTP = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      throw new ValidationError("Phone number is required");
    }

    // Validate phone number format (you can add more validation)
    if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
      throw new ValidationError("Invalid phone number format");
    }

    await authService.generateOTP(phoneNumber);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      throw new ValidationError("Phone number and OTP are required");
    }

    await authService.verifyOTP(phoneNumber, otp);

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset OTP
 */
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({
        statusCode: 0,
        message: "Phone number is required",
      });
    }

    // Check if user exists
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      return res.status(404).json({
        statusCode: 0,
        message: "User not found",
      });
    }

    // Generate and send OTP
    const result = await otpService.generateResetPasswordOTP(phoneNumber);

    successResponse(res, "OTP sent successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP for password reset
 */
exports.verifyPasswordResetOTP = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        statusCode: 0,
        message: "Phone number and OTP are required",
      });
    }

    // Check if user exists
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      return res.status(404).json({
        statusCode: 0,
        message: "User not found",
      });
    }

    // Verify OTP
    otpService.verifyResetPasswordOTP(phoneNumber, otp);

    // Generate a temporary token for password reset
    const resetToken = jwt.sign(
      { phoneNumber, type: "password_reset" },
      config.secret,
      { expiresIn: "5m" }
    );

    successResponse(res, "OTP verified successfully", {
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using reset token
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        statusCode: 0,
        message: "Reset token and new password are required",
      });
    }

    // Verify reset token
    const decoded = jwt.verify(resetToken, config.secret);
    if (decoded.type !== "password_reset") {
      throw new AppError("Invalid reset token", 400);
    }

    // Check if user exists
    const user = await User.findOne({
      where: { phoneNumber: decoded.phoneNumber },
    });
    if (!user) {
      return res.status(404).json({
        statusCode: 0,
        message: "User not found",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({ password: hashedPassword });

    successResponse(res, "Password reset successfully", {
      phoneNumber: decoded.phoneNumber,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({
        statusCode: 0,
        message: "Invalid or expired reset token",
      });
    }
    next(error);
  }
};

/**
 * Register a new user after OTP verification
 */
exports.signup = async (req, res, next) => {
  try {
    let { fullName, phoneNumber, password, gender, birthdate, avatar } =
      req.body;

    console.log("req.body", req.body);

    if (phoneNumber.startsWith("+84")) {
      phoneNumber = phoneNumber.replace("+84", "0");
    }

    const user = await authService.registerUser({
      phoneNumber,
      fullName,
      password,
      gender,
      birthdate,
      avatar: avatar || undefined,
      roles: ["user"],
    });

    const userRoles = await user.getRoles();
    const token = authService.generateToken(user.id);

    return successResponse(res, "User registered successfully!", {
      user: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        birthdate: user.birthdate,
        avatar: user.avatar,
        banner: user.banner,
        roles: userRoles.map((role) => role.name),
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sign in with phone number and password
 */
exports.signin = async (req, res, next) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({
        statusCode: 0,
        message: "Phone number and password are required",
      });
    }

    const authData = await authService.authenticateUser(phoneNumber, password);

    return successResponse(res, "Login successful!", authData);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate QR code for passwordless login
 */
exports.generateQR = async (req, res, next) => {
  try {
    // Get the real client IP address
    const getClientIp = (req) => {
      // Check for X-Forwarded-For header first
      const forwardedFor = req.headers["x-forwarded-for"];
      if (forwardedFor) {
        // Get the first IP in the list (client's real IP)
        return forwardedFor.split(",")[0].trim();
      }

      // Fallback to other headers
      return (
        req.headers["x-real-ip"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket?.remoteAddress
      );
    };

    // Get device information from the web browser
    const deviceInfo = {
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"],
      platform: getUserPlatform(req.headers["user-agent"]),
      device: req.headers["sec-ch-ua-mobile"] === "?1" ? "Mobile" : "Desktop",
      environment: getUserEnvironment(req),
    };

    const { sessionId, qrData } = await authService.generateQRSession(
      deviceInfo
    );

    // Generate QR code with optimal settings
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "M", // Medium error correction
      margin: 2, // Smaller margin
      width: 300, // Fixed size
      color: {
        dark: "#000000", // Black
        light: "#ffffff", // White
      },
    });

    return successResponse(res, "QR code generated successfully", {
      qrCode: qrCodeDataUrl,
      sessionId,
      deviceInfo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process QR code scan from mobile app
 */
exports.scanQR = async (req, res, next) => {
  try {
    const { sessionId, userId } = req.body;

    if (!sessionId || !userId) {
      return res.status(400).json({
        statusCode: 0,
        message: "Session ID and user ID are required",
      });
    }

    // Get device information
    const deviceInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      platform: req.headers["sec-ch-ua-platform"] || "Unknown",
      device: req.headers["sec-ch-ua-mobile"] === "?1" ? "Mobile" : "Desktop",
    };

    // Validate UUID format
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        userId
      )
    ) {
      return res.status(400).json({
        statusCode: 0,
        message: "Invalid user ID format. Must be a UUID.",
      });
    }

    const authData = await authService.processQRLogin(
      sessionId,
      userId,
      deviceInfo
    );

    return successResponse(res, "QR login successful!", authData);
  } catch (error) {
    next(error);
  }
};

/**
 * Check QR session status (for polling from web)
 */
exports.checkQRStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        statusCode: 0,
        message: "Session ID is required",
      });
    }

    // Get the QR session status
    const statusData = authService.checkQRSessionStatus(sessionId);

    console.log("QR status data:", JSON.stringify(statusData));

    // Ensure consistent response format
    if (statusData.status === "completed") {
      return successResponse(res, "QR login successful!", {
        status: "completed",
        user: statusData.user,
        accessToken: statusData.accessToken,
      });
    }

    return successResponse(res, "QR status retrieved", {
      status: statusData.status,
    });
  } catch (error) {
    next(error);
  }
};
