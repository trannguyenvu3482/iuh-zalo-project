import instance from '../service/axios'

const BASE_URL = '/users/friends'

/**
 * Get friend list
 * @returns {Promise<Array>} List of friends
 */
const getFriends = () => {
  return instance.get(BASE_URL)
}

/**
 * Get pending friend requests
 * @returns {Promise<Array>} List of friend requests
 */
const getSentFriendRequests = async () => {
  console.log('API call: getSentFriendRequests')
  // Add timestamp to prevent caching
  return instance.get(`${BASE_URL}/sent-requests`, {
    params: { _t: Date.now() },
  })
}

/**
 * Get received friend requests
 * @returns {Promise<Array>} List of friend requests
 */
const getReceivedFriendRequests = async () => {
  console.log('API call: getReceivedFriendRequests')
  // Add timestamp to prevent caching
  return instance.get(`${BASE_URL}/requests`, {
    params: { _t: Date.now() },
  })
}

/**
 * Send friend request
 * @param {Object} requestData - The request data
 * @param {string} requestData.userId - The user ID to send request to
 * @param {string} [requestData.message] - Optional message
 * @returns {Promise<Object>} The created request
 */
const sendFriendRequest = ({ userId, message = '' }) => {
  return instance.post(`${BASE_URL}/add`, {
    friendId: userId,
    message,
  })
}

/**
 * Cancel a friend request that you've sent
 * @param {string} userId - The user ID of the request recipient
 * @returns {Promise<Object>} Response data
 */
const cancelFriendRequest = (userId) => {
  console.log('API call: cancelFriendRequest', userId)
  return instance.delete(`${BASE_URL}/cancel`, {
    data: { friendId: userId },
  })
}

/**
 * Respond to friend request
 * @param {Object} responseData - The response data
 * @param {string} responseData.requestId - The request ID
 * @param {string} responseData.status - The response status ('accepted' or 'rejected')
 * @returns {Promise<Object>} Response data
 */
const respondToRequest = ({ requestId, status }) => {
  if (status === 'accepted') {
    return instance.put(`${BASE_URL}/accept`, { friendId: requestId })
  } else {
    return instance.put(`${BASE_URL}/reject`, { friendId: requestId })
  }
}

/**
 * Remove a friend
 * @param {string} friendId - The friend ID to remove
 * @returns {Promise<Object>} Response data
 */
const removeFriend = async (friendId) => {
  return instance.delete(`${BASE_URL}/remove`, {
    data: { friendId },
  })
}

/**
 * Get friendship status
 * @param {string} userId - The user ID to get status for
 * @returns {Promise<Object>} Friendship status
 */
const getFriendshipStatus = async (userId) => {
  // Storage key format for localStorage
  const storageKey = `friendship_status_${userId}`

  return instance
    .get(`${BASE_URL}/status/${userId}`)
    .then((response) => {
      // Store response data in localStorage for persistence
      if (response?.data) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(response.data))
        } catch (e) {
          console.error('Error storing friendship status:', e)
        }
      }
      return response
    })
    .catch((error) => {
      console.error(`Error fetching friendship status:`, error)
      throw error
    })
}

/**
 * Search for users by name or phone number
 * @param {string} query - The search query
 * @returns {Promise<Array>} Search results
 */
const searchUsers = async (query) => {
  return instance.get(`${BASE_URL}/search`, {
    params: { q: query },
  })
}

export {
  cancelFriendRequest,
  getFriends,
  getFriendshipStatus,
  getReceivedFriendRequests,
  getSentFriendRequests,
  removeFriend,
  respondToRequest,
  searchUsers,
  sendFriendRequest,
}
