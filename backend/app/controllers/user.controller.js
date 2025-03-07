const userService = require("../services/user.service");
const { UnauthorizedError } = require("../exceptions/errors");
const { successResponse } = require("../utils/response");

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
