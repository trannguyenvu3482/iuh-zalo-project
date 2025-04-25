import axiosInstance from "../lib/axios";

const BASE_URL = "/users/friends";

/**
 * Get all friends of the current user
 */
const getFriends = async () => {
  return await axiosInstance.get(BASE_URL);
};

/**
 * Get all friend requests for the current user
 */
const getFriendRequests = async () => {
  return await axiosInstance.get(`${BASE_URL}/requests`);
};

/**
 * Send a friend request to another user
 */
const sendFriendRequest = async (userId: string) => {
  return await axiosInstance.post(`${BASE_URL}/request`, { userId });
};

/**
 * Accept a friend request
 */
const acceptFriendRequest = async (requestId: string) => {
  return await axiosInstance.put(`${BASE_URL}/request/${requestId}/accept`);
};

/**
 * Reject a friend request
 */
const rejectFriendRequest = async (requestId: string) => {
  return await axiosInstance.put(`${BASE_URL}/request/${requestId}/reject`);
};

/**
 * Remove a friend
 */
const removeFriend = async (friendId: string) => {
  return await axiosInstance.delete(`${BASE_URL}/${friendId}`);
};

export {
  acceptFriendRequest,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
};
