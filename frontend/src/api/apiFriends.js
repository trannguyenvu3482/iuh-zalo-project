import axios from '../service/axios'

const BASE_URL = '/users/friends'

/**
 * Get friend list
 * @returns {Promise<Array>} List of friends
 */
export const getFriends = async () => {
  try {
    const response = await axios.get(BASE_URL)
    return response.data || []
  } catch (error) {
    console.error('Error fetching friends:', error)
    throw new Error(error.message || 'Failed to fetch friends')
  }
}

/**
 * Get pending friend requests
 * @returns {Promise<Array>} List of friend requests
 */
export const getFriendRequests = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/requests`)
    return response.data || []
  } catch (error) {
    console.error('Error fetching friend requests:', error)
    throw new Error(error.message || 'Failed to fetch friend requests')
  }
}

/**
 * Send friend request
 * @param {Object} requestData - The request data
 * @param {string} requestData.userId - The user ID to send request to
 * @param {string} [requestData.message] - Optional message
 * @returns {Promise<Object>} The created request
 */
export const sendFriendRequest = async ({ userId, message = '' }) => {
  try {
    const response = await axios.post(`${BASE_URL}/add`, {
      friendId: userId,
      message,
    })
    return response.data
  } catch (error) {
    console.error('Error sending friend request:', error)
    throw new Error(error.message || 'Failed to send friend request')
  }
}

/**
 * Respond to friend request
 * @param {Object} responseData - The response data
 * @param {string} responseData.requestId - The request ID
 * @param {string} responseData.status - The response status ('accepted' or 'rejected')
 * @returns {Promise<Object>} Response data
 */
export const respondToRequest = async ({ requestId, status }) => {
  try {
    if (status === 'accepted') {
      const response = await axios.put(`${BASE_URL}/accept`, { requestId })
      return response.data
    } else {
      const response = await axios.put(`${BASE_URL}/reject`, { requestId })
      return response.data
    }
  } catch (error) {
    console.error('Error responding to friend request:', error)
    throw new Error(error.message || 'Failed to respond to friend request')
  }
}

/**
 * Remove a friend
 * @param {string} friendId - The friend ID to remove
 * @returns {Promise<Object>} Response data
 */
export const removeFriend = async (friendId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/remove`, {
      data: { friendId },
    })
    return response.data
  } catch (error) {
    console.error('Error removing friend:', error)
    throw new Error(error.message || 'Failed to remove friend')
  }
}

/**
 * Search for users by name or phone number
 * @param {string} query - The search query
 * @returns {Promise<Array>} Search results
 */
export const searchUsers = async (query) => {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: { q: query },
    })
    return response.data || []
  } catch (error) {
    console.error('Error searching users:', error)
    throw new Error(error.message || 'Failed to search users')
  }
}

export default {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  respondToRequest,
  removeFriend,
  searchUsers,
}
