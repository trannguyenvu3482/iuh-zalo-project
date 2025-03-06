const userService = require("../services/user.service");

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
  const userId = req.user?.id;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const result = await userService.searchUserByPhone(phoneNumber, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
