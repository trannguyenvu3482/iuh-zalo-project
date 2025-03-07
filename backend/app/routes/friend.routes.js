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
  app.get(
    "/api/users/friends",
    [authJwt.verifyToken],
    friendController.getFriendList
  );
};
