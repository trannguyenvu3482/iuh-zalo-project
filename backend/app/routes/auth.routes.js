const { verifySignUp } = require("../middleware");
const controller = require("../controllers/auth.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept, x-access-token, Authorization"
    );
    next();
  });

  // OTP verification routes
  app.post("/api/auth/request-otp", controller.requestOTP);
  app.post("/api/auth/verify-otp", controller.verifyOTP);

  // User registration
  app.post(
    "/api/auth/signup",
    [verifySignUp.checkDuplicatePhoneNumber, verifySignUp.checkRolesExisted],
    controller.signup
  );

  // Login with credentials
  app.post("/api/auth/signin", controller.signin);

  // QR code login routes
  app.get("/api/auth/generate-qr", controller.generateQR);
  app.post("/api/auth/scan-qr", controller.scanQR);
  app.get("/api/auth/qr-status/:sessionId", controller.checkQRStatus);
};
