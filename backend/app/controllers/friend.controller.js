const friendService = require("../services/friend.service");
const { UnauthorizedError } = require("../exceptions/errors");

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

exports.addFriend = async (req, res, next) => {
  const { phoneNumber } = req.body;
  const userId = req.user?.id;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const friendship = await friendService.addFriend(userId, phoneNumber);
    if (io) {
      io.to(`user_${friendship.friendId}`).emit("friend_request", {
        from: userId,
        friendshipId: friendship.id,
      });
    }
    res.status(201).json(friendship);
  } catch (error) {
    next(error);
  }
};

exports.acceptFriend = async (req, res, next) => {
  const { friendId } = req.body;
  const userId = req.user?.id;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const friendship = await friendService.acceptFriend(userId, friendId);
    if (io) {
      io.to(`user_${friendId}`).emit("friend_accepted", { from: userId });
    }
    res.status(200).json(friendship);
  } catch (error) {
    next(error);
  }
};

exports.getFriendList = async (req, res, next) => {
  const userId = req.user?.id;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const friends = await friendService.getFriendList(userId);
    res.status(200).json(friends);
  } catch (error) {
    next(error);
  }
};

module.exports = { setIo, ...exports };
