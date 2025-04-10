import axiosInstance from "../lib/axios";

const BASE_URL = "/users";

/**
 * Search for a user by phone number
 */
const searchUserByPhoneNumber = async (phoneNumber: string) => {
  return await axiosInstance.get(`${BASE_URL}/search`, {
    params: { phoneNumber },
  });
};

/**
 * Get current user information
 */
const getUserInfo = async () => {
  return await axiosInstance.get(`${BASE_URL}/me`);
};

/**
 * Update user profile information
 */
const updateUserProfile = async (userData: any) => {
  return await axiosInstance.put(`${BASE_URL}/profile`, userData);
};

export { getUserInfo, searchUserByPhoneNumber, updateUserProfile };
