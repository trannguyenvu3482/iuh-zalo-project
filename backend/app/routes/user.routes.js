const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept, Authorization"
    );
    next();
  });

  // Test methods
  app.get("/api/test/all", controller.allAccess);

  app.get("/api/test/user", [authJwt.verifyToken], controller.userBoard);

  app.get(
    "/api/test/mod",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorBoard
  );

  app.get(
    "/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  // User methods
  app.get("/api/users/me", [authJwt.verifyToken], controller.getMyProfile);

  app.get(
    "/api/users/search",
    [authJwt.verifyToken],
    controller.searchUserByPhone
  );

  app.get("/api/users/:queryId", [authJwt.verifyToken], controller.getUserById);

  app.get(
    "/api/users",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getAllUsers
  );
  
  // Profile management routes
  app.put(
    "/api/users/profile",
    [authJwt.verifyToken],
    controller.updateProfile
  );
  
  app.put(
    "/api/users/avatar",
    [authJwt.verifyToken],
    controller.updateAvatar
  );
  
  app.put(
    "/api/users/banner",
    [authJwt.verifyToken],
    controller.updateBanner
  );
  
  app.put(
    "/api/users/status",
    [authJwt.verifyToken],
    controller.updateStatus
  );
};
