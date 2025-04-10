import axiosInstance from "../lib/axios";

const BASE_URL = "/messages";

/**
 * Get messages for a specific conversation
 */
const getMessages = async (
  conversationId: string,
  params?: { limit?: number; before?: string },
) => {
  return await axiosInstance.get(`${BASE_URL}/${conversationId}`, { params });
};

/**
 * Send a new message
 */
const sendMessage = async (
  conversationId: string,
  content: string,
  type: string = "text",
) => {
  return await axiosInstance.post(`${BASE_URL}/${conversationId}`, {
    content,
    type,
  });
};

/**
 * Delete a message
 */
const deleteMessage = async (messageId: string) => {
  return await axiosInstance.delete(`${BASE_URL}/${messageId}`);
};

/**
 * Edit a message
 */
const editMessage = async (messageId: string, content: string) => {
  return await axiosInstance.put(`${BASE_URL}/${messageId}`, { content });
};

/**
 * React to a message
 */
const reactToMessage = async (messageId: string, reaction: string) => {
  return await axiosInstance.post(`${BASE_URL}/${messageId}/reactions`, {
    reaction,
  });
};

/**
 * Remove a reaction from a message
 */
const removeReaction = async (messageId: string, reactionId: string) => {
  return await axiosInstance.delete(
    `${BASE_URL}/${messageId}/reactions/${reactionId}`,
  );
};

export {
  deleteMessage,
  editMessage,
  getMessages,
  reactToMessage,
  removeReaction,
  sendMessage,
};
