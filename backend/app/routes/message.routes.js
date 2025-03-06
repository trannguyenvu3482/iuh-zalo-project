const { authJwt } = require("../middleware");
const messageController = require("../controllers/message.controller");
const conversationController = require("../controllers/conversation.controller");
const friendController = require("../controllers/friend.controller");
const reactionController = require("../controllers/reaction.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Message Routes
  app.post(
    "/api/messages/private",
    [authJwt.verifyToken],
    messageController.sendPrivateMessage
  );
  app.post(
    "/api/messages/group",
    [authJwt.verifyToken],
    messageController.sendGroupMessage
  );

  // Conversation Routes
  app.get(
    "/api/conversations/:conversationId/messages",
    [authJwt.verifyToken],
    conversationController.getConversationMessages
  );
  app.post(
    "/api/groups",
    [authJwt.verifyToken],
    conversationController.createGroup
  );
  app.put(
    "/api/conversations/update",
    [authJwt.verifyToken],
    conversationController.updateConversation
  );
  app.get(
    "/api/messages/recent",
    [authJwt.verifyToken],
    conversationController.getRecent
  );

  // Reaction Routes
  app.put(
    "/api/messages/edit",
    [authJwt.verifyToken],
    reactionController.editMessage
  );
  app.post(
    "/api/messages/reaction",
    [authJwt.verifyToken],
    reactionController.addReaction
  );
  app.get(
    "/api/messages/reaction/:messageId",
    [authJwt.verifyToken],
    reactionController.getReactions
  );

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
  app.get(
    "/api/users/friends",
    [authJwt.verifyToken],
    friendController.getFriendList
  );
};
