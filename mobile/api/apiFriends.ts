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
const getFriendRequest = async (friendId: string) => {
  const token = getToken();
  return await axiosInstance.post(
    `${BASE_URL}/add`,
    { friendId }, // body
    { headers: { "x-access-token": token } }
  );
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

const getReceivedFriendRequests = async (userId: string) => {
  const token = getToken();
  return await axiosInstance.get(
    `${BASE_URL}/requests`,
    {
      headers: { "x-access-token": token },
      params: { userId }, // Thêm userId vào query params
    }
  );
};

/**
 * Chấp nhận lời mời kết bạn
 */
const acceptFriendRequest = async (friendId: string) => {
  const token = getToken();
  return await axiosInstance.put(
    `${BASE_URL}/accept`,
    { friendId },
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
const cancelFriendRequest = async (friendId: string, userId: string) => {
  const token = getToken();
  return await axiosInstance.delete(`${BASE_URL}/cancel`, {
    headers: { "x-access-token": token },
    data: { friendId, userId },
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
  getFriendRequest,
  getSentFriendRequests,
  getReceivedFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendshipStatus,
  getFriendSuggestions,
};