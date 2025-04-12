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
  const response = await axiosInstance.get(`${BASE_URL}/me`);
  return response.data;
};

/**
 * Update user profile information
 */
const updateUserProfile = async (userData: any) => {
  return await axiosInstance.put(`${BASE_URL}/profile`, userData);
};

/**
 * Update user avatar
 */
const updateUserAvatar = async (avatar: any, token?: string) => {
  return await axiosInstance.put(`${BASE_URL}/avatar`, avatar, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
};

/**
 * Update user banner
 */
const updateUserBanner = async (banner: any, token?: string) => {
  return await axiosInstance.put(`${BASE_URL}/banner`, banner, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
};

/**
 * Search for a user by phone number (public endpoint, no authentication required)
 */
const searchUserByPhoneNumberPublic = async (phoneNumber: string) => {
  return await axiosInstance.get(`${BASE_URL}/search-phone`, {
    params: { phoneNumber },
  });
};

/**
 * Change user password
 */
const changePassword = async (oldPassword: string, newPassword: string) => {
  return await axiosInstance.put(`${BASE_URL}/change-password`, {
    oldPassword,
    newPassword,
  });
};

export {
  changePassword,
  getUserInfo,
  searchUserByPhoneNumber,
  searchUserByPhoneNumberPublic,
  updateUserAvatar,
  updateUserBanner,
  updateUserProfile,
};
