import instance from '../service/axios'

const BASE_URL = '/conversations'

/**
 * Search for conversations by name
 * @param {string} name - The name to search for
 * @returns {Promise<Object>} - Search results
 */
const searchConversationsByName = (name) => {
  return instance.get(`${BASE_URL}/search?name=${name}`)
}

/**
 * Create a new group conversation
 * @param {Object} groupData - The group data
 * @param {string} groupData.name - The group name
 * @param {Array<string>} groupData.userIds - Array of user IDs to add to the group
 * @param {string} [groupData.avatar] - Optional group avatar URL
 * @returns {Promise<Object>} - The created group
 */
const createGroup = async (groupData) => {
  return instance.post('/groups', groupData)
}

export { createGroup, searchConversationsByName }
