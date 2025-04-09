const { authJwt } = require("../middleware");
const messageController = require("../controllers/message.controller");
const conversationController = require("../controllers/conversation.controller");
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
  app.put(
    "/api/conversations/nickname",
    [authJwt.verifyToken],
    conversationController.setNickname
  );
  app.post(
    "/api/conversations/clear",
    [authJwt.verifyToken],
    conversationController.clearChatHistory
  );
  app.post(
    "/api/groups/leave",
    [authJwt.verifyToken],
    conversationController.leaveGroup
  );
  app.delete(
    "/api/groups/delete",
    [authJwt.verifyToken],
    conversationController.deleteGroup
  );
  app.get(
    "/api/messages/recent",
    [authJwt.verifyToken],
    conversationController.getRecent
  );
  
  // New route for getting all user's conversations
  app.get(
    "/api/conversations",
    [authJwt.verifyToken],
    conversationController.getMyConversations
  );
  
  // Debug route to check conversation details
  app.get(
    "/api/conversations/:conversationId/debug",
    [authJwt.verifyToken],
    conversationController.debugConversation
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

  // Add members to group
  app.post(
    "/api/groups/members/add",
    [authJwt.verifyToken],
    conversationController.addGroupMembers
  );
  
  // Remove member from group
  app.delete(
    "/api/groups/members/remove",
    [authJwt.verifyToken],
    conversationController.removeGroupMember
  );
};
