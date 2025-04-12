import axiosInstance from "../lib/axios";

import { SignupData } from "~/store/signupStore";

const BASE_URL = "/auth";

/**
 * Signup with phone number and password
 * @param data Signup data
 * @returns Authentication data with status
 */
const signup = async (data: SignupData) => {
  return await axiosInstance.post(`${BASE_URL}/signup`, data);
};

/**
 * Login with phone number and password
 */
const login = async (phoneNumber: string, password: string) => {
  console.log("Calling login API with:", { phoneNumber, password });
  try {
    // Use the exact same format as the frontend app
    const response = await axiosInstance.post(`${BASE_URL}/signin`, {
      phoneNumber,
      password,
    });
    console.log("Login response:", response);
    return response;
  } catch (error) {
    console.error("Login API error details:", error);
    throw error;
  }
};

/**
 * Logout the current user
 */
const logout = async () => {
  return await axiosInstance.get(`${BASE_URL}/logout`);
};

/**
 * Get current account information
 */
const getAccount = async () => {
  return await axiosInstance.get(`${BASE_URL}/account`);
};

/**
 * Generate QR code for login
 */
const generateQR = async () => {
  return await axiosInstance.get(`${BASE_URL}/generate-qr`);
};

/**
 * Check QR code login status
 */
const checkQRStatus = async (sessionId: string) => {
  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  return await axiosInstance.get(`${BASE_URL}/qr-status/${sessionId}`);
};

/**
 * Scan QR code and approve login on another device
 * @param sessionId QR session ID
 * @param userId Current user's ID
 * @returns Authentication data with status
 */
const scanQR = async (sessionId: string, userId: string) => {
  if (!sessionId || !userId) {
    throw new Error("Session ID and user ID are required");
  }

  return await axiosInstance.post(`${BASE_URL}/scan-qr`, {
    sessionId,
    userId,
  });
};

/**
 * Request OTP for phone number verification
 * @param phoneNumber Phone number to send OTP to
 * @returns Response with status
 */
const requestOTP = async (phoneNumber: string) => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/request-otp`, {
      phoneNumber,
    });
    return response;
  } catch (error) {
    console.error("Request OTP error:", error);
    throw error;
  }
};

/**
 * Verify OTP for phone number
 * @param phoneNumber Phone number to verify
 * @param otp OTP code to verify
 * @returns Response with verification status
 */
const verifyOTP = async (phoneNumber: string, otp: string) => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/verify-otp`, {
      phoneNumber,
      otp,
    });
    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    throw error;
  }
};

/**
 * Request password reset
 * @param phoneNumber Phone number to request password reset
 * @returns Response with status
 */
const requestPasswordReset = async (phoneNumber: string) => {
  const response = await axiosInstance.post(
    `${BASE_URL}/request-password-reset`,
    {
      phoneNumber,
    },
  );
  return response.data;
};

/**
 * Verify password reset OTP
 * @param phoneNumber Phone number to verify
 * @param otp OTP code to verify
 * @returns Response with verification status
 */
const verifyPasswordResetOTP = async (phoneNumber: string, otp: string) => {
  const response = await axiosInstance.post(
    `${BASE_URL}/verify-password-reset-otp`,
    {
      phoneNumber,
      otp,
    },
  );
  return response.data;
};

/**
 * Reset password
 * @param resetToken Reset token to reset password
 * @param newPassword New password to set
 * @returns Response with status
 */
const resetPassword = async (resetToken: string, newPassword: string) => {
  const response = await axiosInstance.post(`${BASE_URL}/reset-password`, {
    resetToken,
    newPassword,
  });
  return response.data;
};

export {
  checkQRStatus,
  generateQR,
  getAccount,
  login,
  logout,
  requestOTP,
  requestPasswordReset,
  scanQR,
  signup,
  verifyOTP,
  verifyPasswordResetOTP,
};
