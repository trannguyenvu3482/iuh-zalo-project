import axios from 'axios';

// Get the backend API URL from the environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

/**
 * Get an Agora token for a specific channel and UID
 * @param {string} channelName - The channel name
 * @param {number|string} uid - The user ID (will be converted to number)
 * @returns {Promise<{token: string, appId: string, channel: string, uid: number}>}
 */
export const getAgoraToken = async (channelName, uid) => {
  try {
    // Ensure we have valid parameters
    if (!channelName) {
      throw new Error('Channel name is required');
    }
    
    // Default UID to 0 if not provided
    const userId = uid || 0;
    
    // Make request to token server with the full URL
    const response = await axios.get(`${API_URL}/api/token/rtc/${channelName}/${userId}`);
    
    // Log token generation
    console.log(`Generated Agora token for channel: ${channelName}, uid: ${userId}`);
    
    return response.data;
  } catch (error) {
    console.error('Error getting Agora token:', error);
    throw error;
  }
};

export default {
  getAgoraToken,
}; 