const { authJwt } = require("../middleware");
const friendController = require("../controllers/friend.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/users/friends/add",
    [authJwt.verifyToken],
    friendController.addFriend
  );
  app.put(
    "/api/users/friends/accept",
    [authJwt.verifyToken],
    friendController.acceptFriend
  );
  app.put(
    "/api/users/friends/try-accept",
    [authJwt.verifyToken],
    friendController.tryAcceptFriend
  );
  app.get(
    "/api/users/friends",
    [authJwt.verifyToken],
    friendController.getFriendList
  );
  app.get(
    "/api/users/friends/requests",
    [authJwt.verifyToken],
    friendController.getMyFriendRequests
  );
  app.get(
    "/api/users/friends/sent-requests",
    [authJwt.verifyToken],
    friendController.getSentFriendRequests
  );
  app.put(
    "/api/users/friends/reject",
    [authJwt.verifyToken],
    friendController.rejectFriend
  );
  app.delete(
    "/api/users/friends/remove",
    [authJwt.verifyToken],
    friendController.removeFriend
  );
  app.delete(
    "/api/users/friends/cancel",
    [authJwt.verifyToken],
    friendController.cancelFriendRequest
  );
  app.get(
    "/api/users/friends/status/:userId",
    [authJwt.verifyToken],
    friendController.getFriendshipStatus
  );
  app.get(
    "/api/users/friends/suggestions",
    [authJwt.verifyToken],
    friendController.getFriendSuggestions
  );
  // Add test conversation route (admin only)
  app.post(
    "/api/test/create-conversation",
    [authJwt.verifyToken, authJwt.isAdmin], 
    friendController.testCreateConversation
  );
  
  // Add debug route to check conversation members
  app.get(
    "/api/debug/conversation/:conversationId/members",
    [authJwt.verifyToken], 
    friendController.checkConversationMembers
  );
};
