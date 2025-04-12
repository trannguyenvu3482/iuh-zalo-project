const { AppError } = require("../exceptions/errors");
const smsService = require("./sms.service");

// In-memory storage for OTPs
const otpStore = {};

/**
 * Generate and store OTP for password reset
 * @param {string} phoneNumber - Phone number to send OTP to
 * @returns {Promise<Object>} OTP data
 */
exports.generateResetPasswordOTP = async (phoneNumber) => {
  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Store OTP
    otpStore[phoneNumber] = {
      otp,
      expiry,
      type: "password_reset",
    };

    // Send OTP via SMS
    await smsService.sendSMS(
      phoneNumber,
      `[Zalo] Mã xác thực đặt lại mật khẩu của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`
    );

    return {
      phoneNumber,
      expiresIn: 5 * 60, // 5 minutes in seconds
    };
  } catch (error) {
    console.error("Error generating OTP:", error);
    throw new AppError("Failed to generate OTP", 500);
  }
};

/**
 * Verify OTP for password reset
 * @param {string} phoneNumber - Phone number to verify
 * @param {string} otp - OTP to verify
 * @returns {Promise<boolean>} Verification status
 */
exports.verifyResetPasswordOTP = (phoneNumber, otp) => {
  const storedOTP = otpStore[phoneNumber];

  if (!storedOTP) {
    throw new AppError("No OTP request found. Please request a new OTP.", 400);
  }

  if (storedOTP.type !== "password_reset") {
    throw new AppError("Invalid OTP type", 400);
  }

  if (storedOTP.otp !== otp) {
    throw new AppError("Invalid OTP", 400);
  }

  if (Date.now() > storedOTP.expiry) {
    delete otpStore[phoneNumber]; // Clean up expired OTP
    throw new AppError("OTP has expired. Please request a new OTP.", 400);
  }

  // Clean up used OTP
  delete otpStore[phoneNumber];

  return true;
};
