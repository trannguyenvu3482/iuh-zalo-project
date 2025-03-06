class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400); // Bad Request
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401); // Unauthorized
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404); // Not Found
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403); // Forbidden
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
};
