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

const pendingLogins = {};

/**
 * Request OTP for phone verification
 */
exports.requestOTP = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        statusCode: 0,
        message: "Phone number is required"
      });
    }
    
    authService.generateOTP(phoneNumber);
    
    return successResponse(
      res,
      "OTP sent successfully. Please verify within 5 minutes.",
      { sent: true }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    if (!phoneNumber || !otp) {
      return res.status(400).json({ 
        statusCode: 0,
        message: "Phone number and OTP are required"
      });
    }
    
    const verified = authService.verifyOTP(phoneNumber, otp);
    
    return successResponse(
      res,
      "OTP verified successfully",
      { verified }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new user after OTP verification
 */
exports.signup = async (req, res, next) => {
  try {
    const { username, email, password, fullname, phoneNumber, roles: requestRoles } = req.body;
    
    if (!username || !email || !password || !fullname || !phoneNumber) {
      return res.status(400).json({ 
        statusCode: 0,
        message: "All fields are required"
      });
    }
    
    const user = await authService.registerUser({
      username,
      email,
      password,
      fullname,
      phoneNumber,
      roles: requestRoles
    });
    
    const userRoles = await user.getRoles();
    
    return successResponse(
      res,
      "User registered successfully!",
      {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        roles: userRoles.map((role) => role.name),
      },
      201
    );
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
        message: "Phone number and password are required"
      });
    }
    
    const authData = await authService.authenticateUser(phoneNumber, password);
    
    return successResponse(
      res,
      "Login successful!",
      authData
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Generate QR code for passwordless login
 */
exports.generateQR = async (req, res, next) => {
  try {
    const { sessionId, qrData } = await authService.generateQRSession();
    
    // Generate QR code from the data
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    
    return successResponse(
      res,
      "QR code generated successfully",
      { qrCode: qrCodeDataUrl, sessionId }
    );
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
        message: "Session ID and user ID are required"
      });
    }
    
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({
        statusCode: 0,
        message: "Invalid user ID format. Must be a UUID."
      });
    }
    
    const authData = await authService.processQRLogin(sessionId, userId);
    
    return successResponse(
      res,
      "QR login successful!",
      authData
    );
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
        message: "Session ID is required"
      });
    }
    
    const status = authService.checkQRSessionStatus(sessionId);
    
    return successResponse(
      res,
      "QR status retrieved",
      status
    );
  } catch (error) {
    next(error);
  }
};
