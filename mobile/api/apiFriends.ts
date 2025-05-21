import axiosInstance from "../lib/axios";
import { useSigninStore } from "~/store/signinStore";
const BASE_URL = "/users/friends";

// Hàm lấy token từ store
const getToken = () => useSigninStore.getState().data.accessToken;

/**
 * Get all friends of the current user
 */
const getFriends = async () => {
  const token = getToken();
  return await axiosInstance.get(BASE_URL, {
    headers: { "x-access-token": token },
  });
};

/**
 * Get all friend requests for the current user
 */
const getFriendRequests = async () => {
  const token = getToken();
  return await axiosInstance.get(`${BASE_URL}/requests`, {
    headers: { "x-access-token": token },
  });
};

/**
 * Send a friend request to another user
 */
const sendFriendRequest = async (userId: string) => {
  const token = getToken();
  return await axiosInstance.post(
    `${BASE_URL}/request`,
    { userId },
    { headers: { "x-access-token": token } }
  );
};

/**
 * Accept a friend request
 */
const acceptFriendRequest = async (requestId: string) => {
  const token = getToken();
  return await axiosInstance.put(
    `${BASE_URL}/request/${requestId}/accept`,
    {},
    { headers: { "x-access-token": token } }
  );
};

/**
 * Reject a friend request
 */
const rejectFriendRequest = async (requestId: string) => {
  const token = getToken();
  return await axiosInstance.put(
    `${BASE_URL}/request/${requestId}/reject`,
    {},
    { headers: { "x-access-token": token } }
  );
};

/**
 * Remove a friend
 */
const removeFriend = async (friendId: string) => {
  const token = getToken();
  return await axiosInstance.delete(`${BASE_URL}/${friendId}`, {
    headers: { "x-access-token": token },
  });
};

export {
  acceptFriendRequest,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
};