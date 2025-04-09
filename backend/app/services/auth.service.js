const { Op } = require("sequelize");
const { Role, User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const { ValidationError, NotFoundError, UnauthorizedError } = require("../exceptions/errors");
const crypto = require("crypto");

// In-memory OTP storage (in production, use Redis for distributed storage)
const otpStore = {};
const qrSessions = {};
const qrSessionSockets = {};
let io; // Socket.io instance

/**
 * Initialize the service with Socket.IO instance
 * @param {Object} socketIo - Socket.IO server instance
 */
const initializeSocketIO = (socketIo) => {
  io = socketIo;
};

/**
 * Generate a random OTP
 * @returns {string} 6-digit OTP
 */
exports.generateOTP = (phoneNumber) => {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with expiration (5 minutes)
  otpStore[phoneNumber] = {
    code: otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    attempts: 0
  };
  
  // In production, send SMS with the OTP
  console.log(`OTP for ${phoneNumber}: ${otp}`);
  
  return true;
};

/**
 * Verify OTP for the given phone number
 * @param {string} phoneNumber 
 * @param {string} otp 
 * @returns {boolean}
 */
exports.verifyOTP = (phoneNumber, otp) => {
  const otpData = otpStore[phoneNumber];
  
  if (!otpData) {
    throw new ValidationError("OTP expired or not found. Please request a new one.");
  }
  
  // Increment attempts and check for too many attempts
  otpData.attempts += 1;
  if (otpData.attempts >= 5) {
    delete otpStore[phoneNumber];
    throw new ValidationError("Too many failed attempts. Please request a new OTP.");
  }
  
  // Check expiration
  if (Date.now() > otpData.expiresAt) {
    delete otpStore[phoneNumber];
    throw new ValidationError("OTP expired. Please request a new one.");
  }
  
  // Check OTP
  if (otpData.code !== otp) {
    throw new ValidationError("Invalid OTP. Please try again.");
  }
  
  // OTP is valid, remove it from store to prevent reuse
  delete otpStore[phoneNumber];
  return true;
};

/**
 * Register a new user
 * @param {Object} userData - User data
 * @returns {Object} Created user
 */
exports.registerUser = async (userData) => {
  const { username, email, password, fullname, phoneNumber } = userData;
  
  // Check if user with phone number already exists
  const existingUser = await User.findOne({ where: { phoneNumber } });
  if (existingUser) {
    throw new ValidationError("Phone number is already in use.");
  }
  
  // Create new user
  const user = await User.create({
    username,
    email,
    password: bcrypt.hashSync(password, 10),
    fullname,
    phoneNumber,
  });
  
  // Assign roles
  await this.assignRolesToUser(user, userData.roles);
  
  return user;
};

/**
 * Authenticate user with credentials
 * @param {string} phoneNumber 
 * @param {string} password 
 * @returns {Object} User data and token
 */
exports.authenticateUser = async (phoneNumber, password) => {
  const user = await User.findOne({ where: { phoneNumber } });
  
  if (!user) {
    throw new NotFoundError("Số điện thoại hoặc mật khẩu không chính xác.");
  }
  
  const passwordIsValid = bcrypt.compareSync(password, user.password);
  if (!passwordIsValid) {
    throw new UnauthorizedError("Số điện thoại hoặc mật khẩu không chính xác.");
  }
  
  const token = this.generateToken(user.id);
  const roles = await user.getRoles();
  
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      avatar: user.avatar,
      roles: roles.map(role => role.name),
    },
    accessToken: token
  };
};

/**
 * Generate JWT token
 * @param {number} userId 
 * @returns {string} JWT token
 */
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.secret, {
    expiresIn: 86400, // 24 hours
  });
};

/**
 * Generate QR session
 * @returns {Object} Session ID and QR data
 */
exports.generateQRSession = async () => {
  const sessionId = crypto.randomBytes(16).toString("hex");
  
  // Store QR session with expiration
  qrSessions[sessionId] = {
    status: "pending",
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 1000, // 1 minute
  };
  
  const apiUrl = process.env.API_URL || 'http://localhost:8081';
  
  // Create QR data object with clear instructions
  const qrData = JSON.stringify({
    type: "ZALO_QR_LOGIN",
    sessionId: sessionId,
    instructions: "Scan with Zalo app to log in",
    apiEndpoint: `${apiUrl}/api/auth/scan-qr`,
    expiresAt: Date.now() + 60 * 1000, // 1 minute
  });
  
  return { sessionId, qrData };
};

/**
 * Process QR login
 * @param {string} sessionId 
 * @param {string} userId - UUID string
 * @returns {Object} User data and token
 */
exports.processQRLogin = async (sessionId, userId) => {
  const session = qrSessions[sessionId];
  
  if (!session) {
    throw new ValidationError("Invalid or expired QR session.");
  }
  
  if (Date.now() > session.expiresAt) {
    delete qrSessions[sessionId];
    delete qrSessionSockets[sessionId];
    throw new ValidationError("QR session expired.");
  }
  
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    
    const token = this.generateToken(user.id);
    const roles = await user.getRoles();
    
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      roles: roles.map(role => role.name),
    };

    const responseData = {
      status: "completed",
      user: userData,
      accessToken: token
    };

    if (io) {
      const roomName = `qr_${sessionId}`;
      const roomClients = io.sockets.adapter.rooms.get(roomName)?.size || 0;
      console.log(`Before emitting to ${roomName}, clients: ${roomClients}`);
      
      if (roomClients > 0) {
        io.to(roomName).emit('qr:status', responseData);
        console.log(`Emitted qr:status to ${roomName} with ${roomClients} clients`);
      } else {
        const targetSocketId = qrSessionSockets[sessionId];
        if (targetSocketId) {
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            console.log(`Room empty, emitting directly to socket ${targetSocketId}`);
            targetSocket.emit('qr:status', responseData);
          } else {
            console.log(`Socket ${targetSocketId} not found for session ${sessionId}`);
          }
        } else {
          console.log(`No socket mapped for session ${sessionId}`);
        }
      }
    }

    // Clean up immediately after emitting
    delete qrSessions[sessionId];
    delete qrSessionSockets[sessionId];

    return responseData;
  } catch (error) {
    console.error('QR Login Error:', error);
    if (io) {
      const roomName = `qr_${sessionId}`;
      io.to(roomName).emit('qr:error', { message: error.message });
    }
    throw error;
  }
};

/**
 * Check QR session status
 * @param {string} sessionId 
 * @returns {Object} Session status
 */
exports.checkQRSessionStatus = async (sessionId) => {
  const session = qrSessions[sessionId];
  if (!session) {
    return { status: 'pending' };
  }
  if (Date.now() > session.expiresAt) {
    delete qrSessions[sessionId];
    delete qrSessionSockets[sessionId];
    return { status: 'expired' };
  }
  return { status: 'pending' }; // Only pending until processed
};

/**
 * Assign roles to a user
 * @param {Object} user - User instance
 * @param {Array} roles - Array of role names
 */
exports.assignRolesToUser = async (user, roles) => {
  if (roles && roles.length > 0) {
    const foundRoles = await Role.findAll({
      where: {
        name: {
          [Op.or]: roles,
        },
      },
    });
    await user.setRoles(foundRoles);
  } else {
    await user.setRoles([1]); // default user role
  }
};

// Export the initialize function
module.exports = {
  ...exports,
  initializeSocketIO,
  qrSessions,
  qrSessionSockets,
};
