const axios = require("axios");
const { AppError } = require("../exceptions/errors");

/**
 * Send SMS using FreeSMS API
 * @param {string} phoneNumber - Phone number to send SMS to
 * @param {string} message - Message content
 * @returns {Promise<boolean>} Success status
 */
exports.sendSMS = async (phoneNumber, message) => {
  try {
    const formatedPhoneNumber = phoneNumber.replace(/^0/, "+84");
    const response = await axios.get(
      "https://admin.freesms.vn/services/send.php",
      {
        params: {
          key: "246e260291f81623dd26d22154914336a81fdcb7",
          number: formatedPhoneNumber,
          message,
          devices: 103,
          type: "sms",
          prioritize: 1,
        },
      }
    );

    return true;
  } catch (error) {
    console.error("SMS sending error:", error);
    throw new AppError("Failed to send SMS", 500);
  }
};
