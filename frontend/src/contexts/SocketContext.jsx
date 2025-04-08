import { useSnackbar } from 'notistack'
import PropTypes from 'prop-types'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import socketService from '../service/socket'
import { useUserStore } from '../zustand/userStore'

// Create a simple notification sound player function that won't cause re-renders
const playNotificationSound = (() => {
  // Create audio element only once, outside of React's render cycle
  let audioElement = null
  // Track last played time for throttling
  let lastPlayedTime = 0
  // Minimum time between sounds in milliseconds (2 seconds)
  const minTimeBetweenSounds = 2000
  // Counter for skipped sounds within a time window
  let skippedSoundCount = 0
  // Time window for counting skipped sounds (10 seconds)
  const skippedSoundWindow = 10000
  // Last time we reset the skipped sound counter
  let lastCounterResetTime = 0

  // Return a function that reuses the element
  return function () {
    try {
      const now = Date.now()

      // Reset skipped sound counter after window expires
      if (now - lastCounterResetTime > skippedSoundWindow) {
        skippedSoundCount = 0
        lastCounterResetTime = now
      }

      // Check if we need to throttle (if sound played too recently)
      if (now - lastPlayedTime < minTimeBetweenSounds) {
        // Increment skipped sound counter
        skippedSoundCount++

        // Log how many notifications were throttled
        if (skippedSoundCount <= 5) {
          console.log(
            `Notification sound throttled (${skippedSoundCount} skipped)`,
          )
        }

        // Don't play the sound - too soon after last one
        return
      }

      // Initialize audio element once if it doesn't exist
      if (!audioElement && typeof Audio !== 'undefined') {
        audioElement = new Audio()
        // Use notification sound from assets
        audioElement.src = '/src/assets/sounds/notification.mp3'
        // Set volume to 60% since the file is pretty loud
        audioElement.volume = 0.6
        // Preload the audio
        audioElement.load()
      }

      // If we have an audio element, play it
      if (audioElement) {
        // Reset to beginning in case it's already playing
        audioElement.currentTime = 0
        // Play with catch for browsers that require user interaction
        const playPromise = audioElement.play()
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            console.log('Audio play failed:', e)
            // Don't need to do anything special here - just prevent errors
          })
        }

        // Update last played time
        lastPlayedTime = now

        // If we had skipped sounds, log that we're playing again
        if (skippedSoundCount > 0) {
          console.log(
            `Playing notification sound after throttling ${skippedSoundCount} notifications`,
          )
        }
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }
})()

// Create socket context
const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useUserStore()
  const [isConnected, setIsConnected] = useState(false)
  const [pendingMessages, setPendingMessages] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const { enqueueSnackbar } = useSnackbar()

  // Track message IDs we've already shown notifications for
  const notifiedMessagesRef = useRef(new Set())

  // Track which conversation is currently active/open
  const activeConversationRef = useRef(null)

  // Track if there are unread messages (for title)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)

  // Clear unread messages flag when window gets focus
  useEffect(() => {
    const handleFocus = () => {
      setHasUnreadMessages(false)
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect socket if user is not authenticated
      socketService.disconnectSocket()
      setIsConnected(false)
      console.log('Socket disconnected: user not authenticated')
      return
    }

    console.log('Initializing socket connection for user:', user.id)

    // Initialize socket connection
    const socket = socketService.initializeSocket()

    // Handle connection events
    const handleConnect = () => {
      console.log('Socket connected successfully')
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    }

    const handleConnectError = (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)

    // Set initial connected state
    setIsConnected(socket.connected)
    console.log('Initial socket connection state:', socket.connected)

    // Cleanup on unmount
    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
    }
  }, [isAuthenticated, user])

  // Utility function to show notification
  const showMessageNotification = (message) => {
    // If this message is for the active conversation, don't show a notification
    if (activeConversationRef.current === message.conversationId) {
      return
    }

    // Create a unique identifier for this message
    const messageId =
      message.id || `${message.senderId}:${message.content}:${Date.now()}`

    // If we've already shown a notification for this message, don't show another
    if (notifiedMessagesRef.current.has(messageId)) {
      return
    }

    // Record that we've shown notification for this message
    notifiedMessagesRef.current.add(messageId)

    // Show the notification
    enqueueSnackbar(`Tin nhắn mới từ ${message.senderName || 'Ai đó'}`, {
      variant: 'info',
    })

    // Play notification sound
    playNotificationSound()

    // Update title to show unread messages
    setHasUnreadMessages(true)

    // Clean up after 60 seconds to prevent memory leaks
    setTimeout(() => {
      notifiedMessagesRef.current.delete(messageId)
    }, 60000)
  }

  // Handle new messages
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const handleNewMessage = (message) => {
      console.log('Socket received new message:', message)

      // Normalize the message format
      const normalizedMessage = {
        ...message,
        // Ensure consistent field names
        content: message.content || message.message,
        message: message.message || message.content,
        senderId: message.senderId || message.sender,
        sender: message.sender || message.senderId,
        // Identify message source
        isFromCurrentUser:
          message.isFromCurrentUser ||
          message.senderId === user.id ||
          message.sender === user.id,
      }

      // Add new message to pending messages
      setPendingMessages((prev) => [...prev, normalizedMessage])

      // Don't show notifications for system messages
      if (
        message.isSystemMessage ||
        message.type === 'SYSTEM' ||
        message.sender === null
      ) {
        return
      }

      // Don't show notifications for messages from the current user
      const isFromCurrentUser =
        message.senderId === user.id ||
        message.sender === user.id ||
        message.isFromCurrentUser === true

      // Only show notification for messages from other users
      if (!isFromCurrentUser) {
        showMessageNotification(message)
      }
    }

    // Subscribe to new message events
    const unsubscribe = socketService.onNewMessage(handleNewMessage)

    return () => {
      unsubscribe()
    }
  }, [isAuthenticated, user])

  // Handle friend requests
  useEffect(() => {
    if (!isAuthenticated) return

    const handleFriendRequest = (request) => {
      // Add new friend request
      setFriendRequests((prev) => [...prev, request])

      // Show notification for new friend request
      enqueueSnackbar(
        `${request.senderName || 'Someone'} sent you a friend request`,
        {
          variant: 'info',
        },
      )

      // Play notification sound for friend request
      playNotificationSound()
    }

    // Subscribe to friend request events
    const unsubscribe = socketService.onFriendRequest(handleFriendRequest)

    return () => {
      unsubscribe()
    }
  }, [isAuthenticated])

  // Handle friend request responses
  useEffect(() => {
    if (!isAuthenticated) return

    const handleFriendRequestResponse = (response) => {
      // Show notification for friend request response
      if (response.status === 'accepted') {
        enqueueSnackbar(
          `${response.userName || 'Someone'} accepted your friend request`,
          {
            variant: 'success',
          },
        )

        // Play notification sound for accepted request
        playNotificationSound()
      } else if (response.status === 'rejected') {
        enqueueSnackbar(
          `${response.userName || 'Someone'} rejected your friend request`,
          {
            variant: 'error',
          },
        )
      }
    }

    // Subscribe to friend request response events
    const unsubscribe = socketService.onFriendRequestResponse(
      handleFriendRequestResponse,
    )

    return () => {
      unsubscribe()
    }
  }, [isAuthenticated])

  // Clear message when component unmounts
  const clearPendingMessage = (messageId) => {
    setPendingMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }

  // Clear friend request
  const clearFriendRequest = (requestId) => {
    setFriendRequests((prev) => prev.filter((req) => req.id !== requestId))
  }

  // Track the active conversation
  const setActiveConversation = (conversationId) => {
    activeConversationRef.current = conversationId

    // Clear unread messages when setting a conversation as active
    setHasUnreadMessages(false)
  }

  // Value to be provided by the context
  const value = {
    isConnected,
    pendingMessages,
    friendRequests,
    clearPendingMessage,
    clearFriendRequest,
    setActiveConversation,
    hasUnreadMessages,
    setHasUnreadMessages,
    ...socketService,
  }

  return (
    <>
      <Helmet>
        <title>
          {hasUnreadMessages ? 'Bạn có tin nhắn mới' : 'Zalo Clone'}
        </title>
      </Helmet>
      <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
    </>
  )
}

SocketProvider.propTypes = {
  children: PropTypes.node,
}

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export default SocketContext
