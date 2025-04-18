import axiosInstance from "../lib/axios";

/**
 * Get messages for a conversation with pagination
 */
export const getMessages = async (
  conversationId: string,
  options: { limit?: number; offset?: number } = {},
) => {
  const { limit = 20, offset = 0 } = options;
  const response = await axiosInstance.get(
    `/conversations/${conversationId}/messages`,
    { params: { limit, offset } },
  );
  return response.data;
};

/**
 * Send a new message to a private chat
 */
export const sendPrivateMessage = async ({
  receiverId,
  content,
  type = "TEXT",
  file,
  conversationId,
}: {
  receiverId: string;
  content: string;
  type?: string;
  file?: string;
  conversationId?: string;
}) => {
  const payload: {
    receiverId: string;
    message: string;
    type: string;
    file?: string;
    conversationId?: string;
  } = {
    receiverId,
    message: content,
    type,
  };

  if (file) {
    payload.file = file;
  }

  if (conversationId) {
    payload.conversationId = conversationId;
  }

  const response = await axiosInstance.post(`/messages/private`, payload);
  return response.data;
};

/**
 * Send a new message to a group chat
 */
export const sendGroupMessage = async ({
  conversationId,
  content,
  type = "TEXT",
}: {
  conversationId: string;
  content: string;
  type?: string;
}) => {
  const response = await axiosInstance.post(`/messages/group`, {
    conversationId,
    message: content,
    type,
  });
  return response.data;
};

/**
 * Send a new message (detect if private or group automatically)
 */
export const sendMessage = async ({
  conversationId,
  content,
  receiverId,
  type = "TEXT",
  file,
}: {
  conversationId: string;
  content: string;
  receiverId?: string;
  type?: string;
  file?: string;
}) => {
  if (receiverId) {
    return sendPrivateMessage({ receiverId, content, type, file });
  }
  return sendGroupMessage({ conversationId, content, type });
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (conversationId: string) => {
  const response = await axiosInstance.put(`/messages/${conversationId}/read`);
  return response.data;
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: string) => {
  const response = await axiosInstance.delete(`/messages/${messageId}`);
  return response.data;
};

/**
 * Get unread message count
 */
export const getUnreadMessageCount = async () => {
  const response = await axiosInstance.get("/messages/unread/count");
  return response.data;
};

/**
 * Recall a message
 */
export const recallMessage = async (messageId: string) => {
  const response = await axiosInstance.post(`/messages/recall`, { messageId });
  return response.data;
};
