// utils/response.js
const successResponse = (res, message, data, statusCode = 200) => {
  return res.status(statusCode).json({
    statusCode: res.statusCode, // Success indicator
    message,
    data: data || null, // Default to null if no data
  });
};

const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    statusCode: 0, // Error indicator
    message,
    data: null,
  });
};

module.exports = { successResponse, errorResponse };
