const db = require("../models");
const ROLES = db.ROLES;
const User = db.User;
const { ValidationError } = require("../exceptions/errors");

/**
 * Check if username or email already exists
 */
const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // Check if fields are provided
    if (!req.body.username || !req.body.email || !req.body.phoneNumber) {
      throw new ValidationError("Username, email, and phone number are required");
    }

    // Check username
    const usernameExists = await User.findOne({
      where: { username: req.body.username }
    });
    
    if (usernameExists) {
      throw new ValidationError("Username is already in use");
    }

    // Check email
    const emailExists = await User.findOne({
      where: { email: req.body.email }
    });
    
    if (emailExists) {
      throw new ValidationError("Email is already in use");
    }
    
    // Check phone number
    const phoneExists = await User.findOne({
      where: { phoneNumber: req.body.phoneNumber }
    });
    
    if (phoneExists) {
      throw new ValidationError("Phone number is already in use");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if requested roles exist
 */
const checkRolesExisted = async (req, res, next) => {
  try {
    if (req.body.roles) {
      for (let i = 0; i < req.body.roles.length; i++) {
        if (!ROLES.includes(req.body.roles[i])) {
          throw new ValidationError(`Role does not exist: ${req.body.roles[i]}`);
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
};

module.exports = verifySignUp;
