import { getSocket } from '../service/socket/index'
import { useUserStore } from '../zustand/userStore'

// Keep track of active calls
export const activeCalls = {}

// Initialize call state tracker if needed
if (typeof window !== 'undefined') {
  window.callState = window.callState || {
    currentCall: null,
    navigatingToCall: false,
  }
}

/**
 * Initialize a call with another user
 */
export const initiateCall = (receiverId, isVideo = true) => {
  const { user } = useUserStore.getState()
  const socket = getSocket()

  if (!socket || !user) {
    console.error('Cannot initiate call: socket or user not available')
    return false
  }

  // Generate a unique channel name
  const channelName = `call-${Date.now()}`

  // Check if receiver is online first
  socket.emit('check:user:connected', { userId: receiverId }, (response) => {
    if (!response?.isConnected) {
      alert('This user is currently offline. Try again later.')
      return
    }

    // Navigate to call page
    navigateToCall({
      calleeId: receiverId,
      callType: isVideo ? 'video' : 'audio',
      channelName,
    })
  })

  return true
}

/**
 * Navigates to the call page with the given parameters
 */
export const navigateToCall = ({
  calleeId,
  callerId,
  callerName,
  callType = 'video',
  channelName,
}) => {
  if (!channelName) {
    channelName = `call-${Date.now()}`
  }

  // Build the URL for the call
  let callUrl = `/call/${channelName}?`

  // Add parameters based on what is provided
  if (calleeId) callUrl += `calleeId=${calleeId}&`
  if (callerId) callUrl += `callerId=${callerId}&`
  if (callerName) callUrl += `callerName=${encodeURIComponent(callerName)}&`
  if (callType) callUrl += `type=${callType}`

  // Remove trailing & if present
  if (callUrl.endsWith('&')) {
    callUrl = callUrl.slice(0, -1)
  }

  console.log(
    'Navigating to call page with URL:',
    callUrl,
    'Channel name:',
    channelName,
  )

  // Store the current call info in the global state
  if (typeof window !== 'undefined') {
    window.callState.currentCall = {
      channelName,
      calleeId,
      callerId,
      callType,
      timestamp: Date.now(),
    }
    window.callState.navigatingToCall = true
  }

  // Navigate to the call page
  window.location.href = callUrl
}

/**
 * Get current call data
 */
export const getCurrentCall = () => {
  if (typeof window !== 'undefined') {
    return window.callState?.currentCall || null
  }
  return null
}

/**
 * End the current call
 */
export const endCurrentCall = () => {
  if (typeof window !== 'undefined') {
    window.callState.currentCall = null
    window.callState.navigatingToCall = false
  }
  // Navigate back to home
  window.location.href = '/'
}

/**
 * Ensure call functions are available globally
 */
export const ensureCallFunctionalityAvailable = () => {
  // Make initiateCall available globally
  if (typeof window !== 'undefined') {
    window.initiateAgoraCall = initiateCall
    window.endCurrentCall = endCurrentCall
  }
  return true
}

// Call this function when the app initializes
ensureCallFunctionalityAvailable()

export default {
  initiateCall,
  navigateToCall,
  getCurrentCall,
  endCurrentCall,
  ensureCallFunctionalityAvailable,
  activeCalls,
}
