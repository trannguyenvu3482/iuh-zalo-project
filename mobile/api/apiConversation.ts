import axiosInstance from "../lib/axios";

const BASE_URL = "/conversations";

/**
 * Get all conversations for the current user
 */
const getConversations = async () => {
  return await axiosInstance.get(BASE_URL);
};

/**
 * Get a specific conversation by ID
 */
const getConversationById = async (conversationId: string) => {
  return await axiosInstance.get(`${BASE_URL}/${conversationId}`);
};

/**
 * Create a new conversation
 */
const createConversation = async (participants: string[]) => {
  return await axiosInstance.post(BASE_URL, { participants });
};

/**
 * Add a participant to a conversation
 */
const addParticipant = async (conversationId: string, userId: string) => {
  return await axiosInstance.post(
    `${BASE_URL}/${conversationId}/participants`,
    {
      userId,
    },
  );
};

/**
 * Remove a participant from a conversation
 */
const removeParticipant = async (conversationId: string, userId: string) => {
  return await axiosInstance.delete(
    `${BASE_URL}/${conversationId}/participants/${userId}`,
  );
};

export {
  addParticipant,
  createConversation,
  getConversationById,
  getConversations,
  removeParticipant,
};
