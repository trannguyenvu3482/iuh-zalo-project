const friendService = require("../services/friend.service");
const conversationService = require("../services/conversation.service");
const { UnauthorizedError, ValidationError } = require("../exceptions/errors");
const { successResponse } = require("../utils/response");

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

exports.addFriend = async (req, res, next) => {
  const { friendId } = req.body;

  if (!friendId) return next(new ValidationError("Friend ID is required"));

  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const friendship = await friendService.addFriend(userId, friendId);
    if (io) {
      io.to(`user_${friendship.friendId}`).emit("friend_request", {
        from: userId,
        friendshipId: friendship.id,
      });
    }
    successResponse(res, "Friend request sent successfully", friendship);
  } catch (error) {
    next(error);
  }
};

exports.acceptFriend = async (req, res, next) => {
  const { friendId } = req.body;
  const userId = req?.userId;

  try {
    if (!friendId) throw new ValidationError("Friend ID is required");
    if (!userId) throw new UnauthorizedError("Authentication required");

    // Accept the friend request
    const friendship = await friendService.acceptFriend(userId, friendId);

    // Create a conversation between the two users
    const conversation = await conversationService.createPrivateConversation(
      userId,
      friendId
    );

    if (io) {
      io.to(`user_${friendId}`).emit("friend_accepted", { from: userId });
      io.to(`user_${friendId}`).emit("conversation_created", { from: userId });
    }
    successResponse(res, "Friend request accepted successfully", {
      friendship, conversation
    });
  } catch (error) {
    next(error);
  }
};

exports.getFriendList = async (req, res, next) => {
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const friends = await friendService.getFriendList(userId);
    successResponse(res, "Friends fetched successfully", friends);
  } catch (error) {
    next(error);
  }
};

exports.getMyFriendRequests = async (req, res, next) => {
  const userId = req?.userId;

  try {
    if (!userId) throw new UnauthorizedError("Authentication required");
    const friendRequests = await friendService.getMyFriendRequests(userId);
    successResponse(res, "Friend requests fetched successfully", friendRequests);
  } catch (error) {
    next(error);
  }
};


module.exports = { setIo, ...exports };
