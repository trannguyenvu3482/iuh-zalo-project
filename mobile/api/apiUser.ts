import axiosInstance from "../lib/axios";
import { useSigninStore } from "~/store/signinStore";

const BASE_URL = "/users";

// Lấy token từ store
const getToken = () => useSigninStore.getState().data.accessToken;

/**
 * Search for a user by phone number (yêu cầu xác thực)
 */
const searchUserByPhoneNumber = async (phoneNumber: string) => {
  const token = getToken();
  return await axiosInstance.get(`${BASE_URL}/search`, {
    params: { phoneNumber },
    headers: { "x-access-token": token },
  });
};

/**
 * Get current user information (yêu cầu xác thực)
 */
const getUserInfo = async () => {
  const token = getToken();
  const response = await axiosInstance.get(`${BASE_URL}/me`, {
    headers: { "x-access-token": token },
  });
  return response.data;
};

/**
 * Update user profile information (yêu cầu xác thực)
 */
const updateUserProfile = async (userData: any) => {
  const token = getToken();
  return await axiosInstance.put(`${BASE_URL}/profile`, userData, {
    headers: { "x-access-token": token },
  });
};

/**
 * Update user avatar (yêu cầu xác thực)
 */
const updateUserAvatar = async (avatar: any) => {
  const token = getToken();
  return await axiosInstance.put(`${BASE_URL}/avatar`, avatar, {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-access-token": token,
    },
  });
};

/**
 * Update user banner (yêu cầu xác thực)
 */
const updateUserBanner = async (banner: any) => {
  const token = getToken();
  return await axiosInstance.put(`${BASE_URL}/banner`, banner, {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-access-token": token,
    },
  });
};

/**
 * Search for a user by phone number (public endpoint, không cần xác thực)
 */
const searchUserByPhoneNumberPublic = async (phoneNumber: string) => {
  return await axiosInstance.get(`${BASE_URL}/search-phone`, {
    params: { phoneNumber },
  });
};

/**
 * Change user password (yêu cầu xác thực)
 */
const changePassword = async (oldPassword: string, newPassword: string) => {
  const token = getToken();
  return await axiosInstance.put(
    `${BASE_URL}/change-password`,
    { oldPassword, newPassword },
    {
      headers: { "x-access-token": token },
    }
  );
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