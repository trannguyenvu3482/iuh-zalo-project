const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.User;
const { ValidationError, UnauthorizedError, ForbiddenError } = require("../exceptions/errors.js");

/**
 * Verify JWT token middleware
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader) {
      throw new ValidationError("No authorization header provided");
    }
    
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new ValidationError("Authorization header format must be 'Bearer {token}'");
    }
    
    const token = parts[1];
    
    try {
      const decoded = jwt.verify(token, config.secret);
      
      // Add user data to request
      const user = await User.findByPk(decoded.id);
      if (!user) {
        throw new UnauthorizedError("User not found");
      }
      
      req.userId = decoded.id;
      req.user = user;
      next();
    } catch (jwtError) {
      throw new UnauthorizedError("Invalid or expired token");
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has admin role
 */
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();
    
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "admin") {
        return next();
      }
    }
    
    throw new ForbiddenError("Require Admin Role");
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has moderator role
 */
const isModerator = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();
    
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "moderator") {
        return next();
      }
    }
    
    throw new ForbiddenError("Require Moderator Role");
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has moderator or admin role
 */
const isModeratorOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();
    
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "moderator" || roles[i].name === "admin") {
        return next();
      }
    }
    
    throw new ForbiddenError("Require Moderator or Admin Role");
  } catch (error) {
    next(error);
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  isModeratorOrAdmin,
};

module.exports = authJwt;
