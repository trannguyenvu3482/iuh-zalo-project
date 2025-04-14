import { useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import PropTypes from 'prop-types'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { onNewMessage } from '../service/socket/chat'
import {
  onFriendRequest,
  onFriendRequestCanceled,
  onFriendRequestResponse,
} from '../service/socket/friends'
import { getSocket } from '../service/socket/index'
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
  const queryClient = useQueryClient()

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
    console.log(
      'SocketContext initializing socket connection for user:',
      user?.id,
    )

    const socket = getSocket() // Always initialize socket

    socket.on('connect', () => {
      console.log(
        'Socket connected successfully in SocketContext for user:',
        user?.id,
      )
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected in SocketContext for user:', user?.id)
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error(
        'Socket connection error in SocketContext for user:',
        user?.id,
        error,
      )
      setIsConnected(false)
    })

    setIsConnected(socket.connected)
    console.log('Initial socket connection state in SocketContext:', {
      connected: socket.connected,
      userId: user?.id,
      socketId: socket.id,
      queryParams: socket.io?.opts?.query,
    })

    // Only set up authenticated listeners if user is authenticated
    if (isAuthenticated && user) {
      console.log(
        'Setting up authenticated socket listeners for user:',
        user.id,
      )
    }

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
    }
  }, [isAuthenticated, user]) // Keep dependencies

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
    const unsubscribe = onNewMessage(handleNewMessage)

    return () => {
      unsubscribe()
    }
  }, [isAuthenticated, user])

  // Handle friend requests
  useEffect(() => {
    if (!isAuthenticated) {
      console.log(
        'Skipping friend request handler setup - user not authenticated',
      )
      return
    }

    console.log('Setting up friend_request handler for user:', user?.id)

    const handleFriendRequest = (request) => {
      console.log(
        'Socket received friend_request event for user',
        user?.id,
        'with data:',
        request,
      )

      // Validate the request
      // if (!request || (!request.id && !request.friendshipId)) {
      //   console.warn('Received invalid friend request data:', request)
      //   return
      // }

      // Normalize the request object to match the API response structure
      const normalizedRequest = {
        id: request.id || request.friendshipId,
        user: {
          id: request.senderId || request.from,
          fullName: request.senderName || 'Someone',
          avatar: request.senderAvatar || '', // Ensure avatar is included
        },
        status: request.status || 'pending', // Default status
        createdAt: request.createdAt || new Date().toISOString(), // Ensure createdAt is included
        mutualGroups: request.mutualGroups || 0, // Ensure mutualGroups is included
      }

      console.log(
        'Normalized friend request for user',
        user?.id,
        ':',
        normalizedRequest,
      )

      // Add new friend request to local state (for notifications), avoiding duplicates
      setFriendRequests((prev) => {
        if (prev.some((req) => req.id === normalizedRequest.id)) {
          console.log(
            'Duplicate friend request detected in friendRequests state:',
            normalizedRequest.id,
          )
          return prev
        }
        return [...prev, normalizedRequest]
      })

      // Show notification for new friend request
      enqueueSnackbar(
        `${normalizedRequest.user.fullName} sent you a friend request`,
        {
          variant: 'info',
        },
      )

      // Play notification sound for friend request
      playNotificationSound()

      // Update the React Query cache directly, avoiding duplicates
      if (queryClient) {
        queryClient.setQueryData(['receivedFriendRequests'], (old) => {
          if (!old || !old.data) return { data: [normalizedRequest] }
          if (old.data.some((req) => req.id === normalizedRequest.id)) {
            console.log(
              'Duplicate friend request detected in cache:',
              normalizedRequest.id,
            )
            return old
          }
          return { ...old, data: [...old.data, normalizedRequest] }
        })

        // Optional: Log the updated cache for debugging
        const updatedCache = queryClient.getQueryData([
          'receivedFriendRequests',
        ])
        console.log(
          'Updated receivedFriendRequests cache for user',
          user?.id,
          ':',
          updatedCache,
        )
      }
    }

    console.log('Setting up friend_request event listener in SocketContext')
    const unsubscribe = onFriendRequest(handleFriendRequest)

    return () => {
      console.log('Cleaning up friend_request event listener in SocketContext')
      unsubscribe()
    }
  }, [isAuthenticated, queryClient, enqueueSnackbar])

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

      // Refresh relevant data in React Query cache
      if (queryClient) {
        queryClient.invalidateQueries(['sentFriendRequests'])
        queryClient.invalidateQueries(['friends'])
        queryClient.invalidateQueries(['friendshipStatus'])
      }
    }

    // Subscribe to friend request response events
    const unsubscribe = onFriendRequestResponse(handleFriendRequestResponse)

    return () => {
      unsubscribe()
    }
  }, [isAuthenticated, queryClient])

  // Handle friend request cancellations
  useEffect(() => {
    if (!isAuthenticated) return

    const handleFriendRequestCancel = (data) => {
      const currentUserId = useUserStore.getState().user?.id

      if (currentUserId === data.friendId) {
        enqueueSnackbar(`Lời mời kết bạn đã bị thu hồi`, { variant: 'info' })
      }

      if (queryClient) {
        // Optimistically update UI by filtering out canceled requests
        queryClient.setQueryData(['receivedFriendRequests'], (old) => {
          if (!old || !old.data) return { data: [] }
          return {
            ...old,
            data: old.data.filter(
              (req) =>
                !(
                  req.user?.id === data.from ||
                  (req.user?.id === data.friendId &&
                    data.from === currentUserId)
                ),
            ),
          }
        })

        queryClient.setQueryData(['sentFriendRequests'], (old) => {
          if (!old || !old.data) return { data: [] }
          return {
            ...old,
            data: old.data.filter(
              (req) =>
                !(
                  req.friend?.id === data.friendId ||
                  (req.friend?.id === data.from &&
                    data.friendId === currentUserId)
                ),
            ),
          }
        })

        // Then invalidate to get fresh data on next render after a slight delay
        setTimeout(() => {
          queryClient.invalidateQueries(['receivedFriendRequests'])
          queryClient.invalidateQueries(['sentFriendRequests'])
          queryClient.invalidateQueries(['friendshipStatus'])
        }, 300)

        // Clear any pending friend requests from state that match the canceled request
        setFriendRequests((prev) =>
          prev.filter(
            (req) =>
              !(
                req.user?.id === data.from ||
                (req.user?.id === data.friendId && data.from === currentUserId)
              ),
          ),
        )
      }
    }

    // Subscribe to both regular cancellation and confirmation events
    const unsubscribe = onFriendRequestCanceled(handleFriendRequestCancel)

    // Get direct access to socket
    const socket = getSocket()

    // Also listen for the confirmation event directly
    socket.on('friend_request_canceled_confirmed', handleFriendRequestCancel)

    return () => {
      unsubscribe()
      socket.off('friend_request_canceled_confirmed', handleFriendRequestCancel)
    }
  }, [isAuthenticated, queryClient, enqueueSnackbar])

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

  // Initialize the socket manually - add this function to fix SocketInitializer
  const initializeSocket = () => {
    console.log('Manually initializing socket for user:', user?.id)
    const socket = getSocket()
    return socket
  }

  // Expose all socket methods in context value
  const socketValue = {
    socket: isConnected ? getSocket() : null,
    isConnected,
    pendingMessages,
    setPendingMessages,
    friendRequests,
    setFriendRequests,
    clearPendingMessage,
    clearFriendRequest,
    setActiveConversation,
    initializeSocket,
    getSocket,
    cancelFriendRequestSocket: (friendId) => {
      const socket = getSocket()
      if (socket) {
        // Send consistent data format matching backend expectations
        socket.emit('friend_request_canceled', {
          friendId,
          from: user?.id,
          timestamp: new Date().toISOString(),
        })

        // Update the cache properly without causing refetch loops
        if (queryClient) {
          // Optimistically update UI by filtering out the request
          queryClient.setQueryData(['sentFriendRequests'], (old) => {
            if (!old || !old.data) return { data: [] }
            return {
              ...old,
              data: old.data.filter((req) => req.friend?.id !== friendId),
            }
          })

          // Then invalidate to get fresh data on next render
          setTimeout(() => {
            queryClient.invalidateQueries(['sentFriendRequests'])
          }, 300)
        }
      }
    },
  }

  return (
    <>
      <Helmet>
        <title>
          {hasUnreadMessages ? 'Bạn có tin nhắn mới' : 'Zalo Clone'}
        </title>
      </Helmet>
      <SocketContext.Provider value={socketValue}>
        {children}
      </SocketContext.Provider>
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
