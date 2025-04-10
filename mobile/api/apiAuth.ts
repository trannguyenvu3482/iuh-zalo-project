import axiosInstance from "../lib/axios";

const BASE_URL = "/auth";

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

export { checkQRStatus, generateQR, getAccount, login, logout, scanQR };
