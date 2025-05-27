import axios from '../service/axios'

/**
 * Get messages for a conversation with pagination
 * @param {string} conversationId - The conversation ID
 * @param {Object} options - Pagination options
 * @param {number} [options.limit=20] - Number of messages to fetch
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<Object>} Messages array and pagination info
 */
export const getConversationMessages = async (conversationId, options = {}) => {
  const { limit = 20, offset = 0 } = options

  try {
    const response = await axios.get(
      `/conversations/${conversationId}/messages`,
      { params: { limit, offset } },
    )

    const { messages = [], pagination = {} } = response.data || {}

    // Normalize message format
    const normalizedMessages = messages.map((message) => ({
      ...message,
      // Ensure both field formats are present
      content: message.content || message.message,
      message: message.message || message.content,
      senderId: message.senderId || message.sender,
      sender: message.sender || message.senderId,
      timestamp: message.timestamp || message.created_at,
      created_at: message.created_at || message.timestamp,
      // Preserve system message flags
      isSystemMessage: message.isSystemMessage || message.type === 'SYSTEM',
      type: message.type || (message.isSystemMessage ? 'SYSTEM' : undefined),
    }))

    return {
      messages: normalizedMessages,
      pagination,
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw new Error(error.message || 'Failed to fetch messages')
  }
}

/**
 * Send a new message to a private chat
 * @param {Object} messageData - The message data
 * @param {string} messageData.receiverId - The recipient ID
 * @param {string} messageData.content - The message content
 * @param {string} [messageData.type] - The message type (TEXT, IMAGE, VIDEO, AUDIO, FILE, GIF)
 * @param {string} [messageData.file] - The file URL for media messages
 * @param {string} [messageData.conversationId] - Optional conversation ID for existing chats
 * @returns {Promise<Object>} The created message
 */
export const sendPrivateMessage = async ({
  receiverId,
  content,
  type = 'TEXT',
  file,
  conversationId,
}) => {
  try {
    const payload = {
      receiverId,
      message: content,
      type,
    }

    // Add file URL for media messages
    if (file) {
      payload.file = file
    }

    // Add conversationId if provided (for existing conversations)
    if (conversationId) {
      payload.conversationId = conversationId
    }

    const response = await axios.post(`/messages/private`, payload)
    return response.data
  } catch (error) {
    console.error('Error sending private message:', error)
    throw new Error(error.message || 'Failed to send private message')
  }
}

/**
 * Send a new message to a group chat
 * @param {Object} messageData - The message data
 * @param {string} messageData.conversationId - The conversation ID
 * @param {string} messageData.content - The message content
 * @param {string} [messageData.type] - The message type (TEXT, IMAGE, VIDEO, AUDIO, FILE, GIF)
 * @returns {Promise<Object>} The created message
 */
export const sendGroupMessage = async ({ conversationId, content, type }) => {
  try {
    const response = await axios.post(`/messages/group`, {
      conversationId,
      message: content,
      type,
    })
    return response.data
  } catch (error) {
    console.error('Error sending group message:', error)
    throw new Error(error.message || 'Failed to send group message')
  }
}

/**
 * Send a new message (detect if private or group automatically)
 * @param {Object} messageData - The message data
 * @param {string} messageData.conversationId - The conversation ID
 * @param {string} messageData.content - The message content
 * @param {string} [messageData.receiverId] - The recipient ID (for private messages)
 * @param {string} [messageData.type] - The message type (TEXT, IMAGE, VIDEO, AUDIO, FILE, GIF)
 * @returns {Promise<Object>} The created message
 */
export const sendNewMessage = async ({
  conversationId,
  content,
  receiverId,
  type,
}) => {
  try {
    // If receiverId is provided, send a private message
    if (receiverId) {
      return sendPrivateMessage({ receiverId, content, type })
    }

    // Otherwise, send a group message
    return sendGroupMessage({ conversationId, content, type })
  } catch (error) {
    console.error('Error sending message:', error)
    throw new Error(error.message || 'Failed to send message')
  }
}

/**
 * Get recent conversations
 * @returns {Promise<Array>} Recent conversations array
 */
export const getRecentConversations = async () => {
  try {
    const response = await axios.get('/messages/recent')
    return response.data || []
  } catch (error) {
    console.error('Error fetching recent conversations:', error)
    throw new Error(error.message || 'Failed to fetch recent conversations')
  }
}

/**
 * Get all conversations
 * @returns {Promise<Object>} Response containing conversations array
 */
export const getAllConversations = async () => {
  try {
    const response = await axios.get('/conversations')
    return response // Return the entire response to get statusCode, message, and data
  } catch (error) {
    console.error('Error fetching conversations:', error)
    throw new Error(error.message || 'Failed to fetch conversations')
  }
}

/**
 * Mark messages as read
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} Response data
 */
export const markMessagesAsRead = async (conversationId) => {
  try {
    const response = await axios.put(`/messages/${conversationId}/read`)
    return response.data
  } catch (error) {
    console.error('Error marking messages as read:', error)
    throw new Error(error.message || 'Failed to mark messages as read')
  }
}

/**
 * Delete a message
 * @param {string} messageId - The message ID
 * @returns {Promise<Object>} Response data
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await axios.delete(`/messages/${messageId}`)
    return response.data
  } catch (error) {
    console.error('Error deleting message:', error)
    throw new Error(error.message || 'Failed to delete message')
  }
}

/**
 * Delete a message just for the current user
 * @param {string} messageId - The message ID
 * @returns {Promise<void>}
 */
export const deleteMessageForUser = async (messageId) => {
  try {
    const response = await axios.delete(`/messages/${messageId}/user`);
    return response.data;
  } catch (error) {
    console.error('Error deleting message for user:', error);
    throw new Error(error.message || 'Failed to delete message for user');
  }
};

/**
 * Get unread message count
 * @returns {Promise<Object>} Unread count object
 */
export const getUnreadMessageCount = async () => {
  try {
    const response = await axios.get('/messages/unread/count')
    return response.data
  } catch (error) {
    console.error('Error fetching unread count:', error)
    throw new Error(error.message || 'Failed to fetch unread count')
  }
}

/**
 * Create a new conversation with another user
 * @param {string} userId - The ID of the user to create a conversation with
 * @param {Object} options - Additional options
 * @param {string} options.content - Initial message content (optional)
 * @returns {Promise<Object>} - The API response
 */
export const createConversation = async (userId, options = {}) => {
  const payload = { userId }

  // Add message content if provided
  if (options && options.content) {
    payload.initialMessage = options.content
  }

  const response = await axios.post('/conversations', payload)
  return response.data
}

/**
 * Recall a message (mark it as recalled)
 * @param {string} messageId - The ID of the message to recall
 * @returns {Promise<Object>} Response data
 */
export const recallMessage = async (messageId) => {
  try {
    const response = await axios.post(`/messages/recall`, { messageId })
    return response.data
  } catch (error) {
    console.error('Error recalling message:', error)
    throw new Error(error.message || 'Failed to recall message')
  }
}

export default {
  getConversationMessages,
  sendPrivateMessage,
  sendGroupMessage,
  sendNewMessage,
  getRecentConversations,
  getAllConversations,
  markMessagesAsRead,
  deleteMessage,
  deleteMessageForUser,
  getUnreadMessageCount,
  createConversation,
  recallMessage,
}
