import axiosInstance from "../lib/axios";
import { useSigninStore } from "~/store/signinStore";
const BASE_URL = "/users/friends";

// Lấy token từ store
const getToken = () => useSigninStore.getState().data.accessToken;

/**
 * Lấy danh sách bạn bè
 */
const getFriends = async () => {
  const token = getToken();
  return await axiosInstance.get(BASE_URL, {
    headers: { "x-access-token": token },
  });
};

/**
 * Lấy danh sách lời mời kết bạn nhận được
 */
const getFriendRequests = async () => {
  const token = getToken();
  return await axiosInstance.get(`${BASE_URL}/requests`, {
    headers: { "x-access-token": token },
  });
};

/**
 * Lấy danh sách lời mời kết bạn đã gửi
 */
const getSentFriendRequests = async () => {
  const token = getToken();
  return await axiosInstance.get(`${BASE_URL}/sent-requests`, {
    headers: { "x-access-token": token },
  });
};

/**
 * Gửi lời mời kết bạn
 */
const sendFriendRequest = async (userId: string) => {
  const token = getToken();
  return await axiosInstance.post(
    `${BASE_URL}/add`,
    { userId },
    { headers: { "x-access-token": token } }
  );
};

/**
 * Chấp nhận lời mời kết bạn
 */
const acceptFriendRequest = async (userId: string) => {
  const token = getToken();
  return await axiosInstance.put(
    `${BASE_URL}/accept`,
    { userId },
    { headers: { "x-access-token": token } }
  );
};

/**
 * Từ chối lời mời kết bạn
 */
const rejectFriendRequest = async (userId: string) => {
  const token = getToken();
  return await axiosInstance.put(
    `${BASE_URL}/reject`,
    { userId },
    { headers: { "x-access-token": token } }
  );
};

/**
 * Hủy lời mời kết bạn đã gửi
 */
const cancelFriendRequest = async (userId: string) => {
  const token = getToken();
  return await axiosInstance.delete(`${BASE_URL}/cancel`, {
    headers: { "x-access-token": token },
    data: { userId },
  });
};

/**
 * Xóa bạn
 */
const removeFriend = async (userId: string) => {
  const token = getToken();
  return await axiosInstance.delete(`${BASE_URL}/remove`, {
    headers: { "x-access-token": token },
    data: { userId },
  });
};

/**
 * Kiểm tra trạng thái kết bạn với user khác
 */
const getFriendshipStatus = async (userId: string) => {
  const token = getToken();
  return await axiosInstance.get(`${BASE_URL}/status/${userId}`, {
    headers: { "x-access-token": token },
  });
};

/**
 * Gợi ý bạn bè
 */
const getFriendSuggestions = async () => {
  const token = getToken();
  return await axiosInstance.get(`${BASE_URL}/suggestions`, {
    headers: { "x-access-token": token },
  });
};

export {
  getFriends,
  getFriendRequests,
  getSentFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendshipStatus,
  getFriendSuggestions,
};