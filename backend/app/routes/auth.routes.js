const { verifySignUp } = require("../middleware");
const controller = require("../controllers/auth.controller");
const express = require("express");
const router = express.Router();

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept, x-access-token, Authorization"
    );
    next();
  });

  // OTP routes
  app.post("/api/auth/request-otp", controller.requestOTP);
  app.post("/api/auth/verify-otp", controller.verifyOTP);

  // Password reset routes
  app.post("/api/auth/request-password-reset", controller.requestPasswordReset);
  app.post(
    "/api/auth/verify-password-reset-otp",
    controller.verifyPasswordResetOTP
  );
  app.post("/api/auth/reset-password", controller.resetPassword);

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

  return router;
};
