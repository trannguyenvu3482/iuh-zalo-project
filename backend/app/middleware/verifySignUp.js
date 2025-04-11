const db = require("../models");
const ROLES = db.ROLES;
const User = db.User;
const { ValidationError } = require("../exceptions/errors");

/**
 * Check if phone number already exists
 */
const checkDuplicatePhoneNumber = async (req, res, next) => {
  try {
    // Check if fields are provided
    if (!req.body.phoneNumber) {
      throw new ValidationError("Phone number is required");
    }

    // Check phone number
    const phoneExists = await User.findOne({
      where: { phoneNumber: req.body.phoneNumber },
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
          throw new ValidationError(
            `Role does not exist: ${req.body.roles[i]}`
          );
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

const verifySignUp = {
  checkDuplicatePhoneNumber,
  checkRolesExisted,
};

module.exports = verifySignUp;
