import axiosInstance from "../lib/axios";

const BASE_URL = "/auth";

/**
 * Login with phone number and password
 */
const login = async (phoneNumber: string, password: string) => {
  return await axiosInstance.post(`${BASE_URL}/signin`, {
    phoneNumber,
    password,
  });
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

export { checkQRStatus, generateQR, getAccount, login, logout };
