import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getConversationMessages, sendNewMessage } from '../api/apiMessage'
import { useSocket } from '../contexts/SocketContext'
import { useUserStore } from '../zustand/userStore'

const MESSAGES_PER_PAGE = 20

export const useChat = (conversation, conversationId) => {
  const { user } = useUserStore()
  const {
    isConnected,
    sendPrivateMessage,
    sendGroupMessage,
    onNewMessage,
    sendTypingStatus,
    onTypingStatus,
    markMessageAsRead,
    onMessageRead,
    setActiveConversation,
    setHasUnreadMessages,
  } = useSocket()
  const [message, setMessage] = useState('')
  const [typingUsers, setTypingUsers] = useState([])
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const typingTimeoutRef = useRef(null)
  const [localMessages, setLocalMessages] = useState([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const scrollPositionRef = useRef(null)
  const [prevLocalMessagesLength, setPrevLocalMessagesLength] = useState(0)

  // Store the active conversation ID in a ref to avoid unnecessary re-renders
  const activeConversationIdRef = useRef(conversationId)

  // Update the ref when conversationId changes
  useEffect(() => {
    activeConversationIdRef.current = conversationId
    // Clear local messages when changing conversations
    setLocalMessages([])
  }, [conversationId])

  // Set active conversation to handle notifications correctly
  useEffect(() => {
    if (conversationId && setActiveConversation) {
      setActiveConversation(conversationId)

      // Clear active conversation when component unmounts
      return () => {
        setActiveConversation(null)
      }
    }
  }, [conversationId, setActiveConversation])

  // Clear unread messages when component is mounted
  useEffect(() => {
    // Check if setHasUnreadMessages is available from the context
    if (typeof setHasUnreadMessages === 'function') {
      // Reset the unread messages flag when entering this conversation
      setHasUnreadMessages(false)
    }
  }, [setHasUnreadMessages])

  // Fetch messages with infinite scrolling
  const {
    data: messagesPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        return await getConversationMessages(conversationId, {
          limit: MESSAGES_PER_PAGE,
          offset: pageParam,
        })
      } catch (error) {
        console.error('Error fetching messages:', error)
        throw error
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      // Handle different API response structures
      if (lastPage.pagination?.hasMore) {
        return lastPage.pagination.offset + lastPage.pagination.limit
      }
      if (lastPage.hasMore) {
        return lastPage.offset + lastPage.limit
      }
      return undefined
    },
    enabled: !!conversationId,
  })

  // Handle scroll to load more messages
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    // If we're near the top (50px or less from top) and there are more messages to load
    if (container.scrollTop <= 50 && hasNextPage && !isFetchingNextPage) {
      setIsLoadingMore(true)
      // Save current scroll position and height
      scrollPositionRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
      }

      fetchNextPage().then(() => {
        setIsLoadingMore(false)
      })
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Maintain scroll position after loading more messages
  useEffect(() => {
    if (
      !isLoadingMore &&
      scrollPositionRef.current &&
      messagesContainerRef.current
    ) {
      const { scrollHeight: oldScrollHeight, scrollTop: oldScrollTop } =
        scrollPositionRef.current
      const newScrollTop =
        messagesContainerRef.current.scrollHeight -
        oldScrollHeight +
        oldScrollTop
      messagesContainerRef.current.scrollTop = newScrollTop
      scrollPositionRef.current = null
    }
  }, [messagesPages, isLoadingMore])

  // Attach scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

  // Send message mutation
  const { mutate: sendMessageMutation } = useMutation({
    mutationFn: (messageData) => {
      // If this is a group chat
      if (conversation?.type === 'GROUP') {
        return sendNewMessage({
          conversationId,
          content: messageData.content,
        })
      }
      // If this is a private chat
      else {
        // Filter out the current user from members
        const otherMembers = conversation?.members?.filter(
          (m) => m.id !== user?.id,
        )
        // Use the first other member, or fallback
        const receiverId = otherMembers?.[0]?.id

        if (!receiverId) {
          throw new Error('Could not find receiver ID')
        }

        return sendNewMessage({
          conversationId,
          content: messageData.content,
          receiverId,
        })
      }
    },
    onSuccess: () => {
      // Delay query invalidation to prevent duplicates
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['messages', conversationId],
        })
      }, 2000) // Wait 2 seconds to allow socket messages to arrive first
    },
    onError: (error) => {
      enqueueSnackbar(`Error sending message: ${error.message}`, {
        variant: 'error',
      })
    },
  })

  // Memoize the message handler to prevent recreating it on every render
  const handleNewMessage = useCallback(
    (message) => {
      const currentConversationId = activeConversationIdRef.current

      // If the message is for the current conversation, add it to local messages
      if (message.conversationId === currentConversationId) {
        // Normalize the message format to ensure consistency
        const normalizedMessage = {
          ...message,
          // Ensure both field formats are present
          content: message.content || message.message,
          message: message.message || message.content,
          senderId: message.senderId || message.sender,
          sender: message.sender || message.senderId,
          timestamp: message.timestamp || message.created_at,
          created_at: message.created_at || message.timestamp,
          // Identify system messages
          isSystemMessage:
            message.isSystemMessage ||
            message.type === 'SYSTEM' ||
            message.sender === null,
          type:
            message.type ||
            (message.isSystemMessage || message.sender === null
              ? 'SYSTEM'
              : undefined),
          // Preserve isFromCurrentUser flag or set it based on the sender ID
          isFromCurrentUser:
            message.isFromCurrentUser ||
            message.senderId === user?.id ||
            message.sender === user?.id,
        }

        // Add the message to local state, avoiding duplicates
        setLocalMessages((prev) => {
          const isDuplicate = prev.some(
            (m) =>
              (m.id && m.id === message.id) ||
              (m.content === (message.content || message.message) &&
                m.senderId === (message.senderId || message.sender)),
          )

          if (isDuplicate) {
            return prev
          }

          return [...prev, normalizedMessage]
        })

        // Mark the message as read if it's not from the current user
        if (
          !normalizedMessage.isSystemMessage &&
          normalizedMessage.senderId !== user?.id &&
          normalizedMessage.sender !== user?.id &&
          normalizedMessage.id &&
          markMessageAsRead
        ) {
          markMessageAsRead(normalizedMessage.id, currentConversationId)
        }

        // Scroll to bottom when new message arrives
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      }
    },
    [user?.id, markMessageAsRead],
  )

  // Handle typing status updates
  const handleTypingStatus = useCallback(
    (data) => {
      const currentConversationId = activeConversationIdRef.current

      // Only update typing status if it's for the current conversation
      if (data.conversationId === currentConversationId) {
        const { userId, isTyping, username } = data

        setTypingUsers((prevTypingUsers) => {
          // Don't show typing indicator for the current user
          if (userId === user?.id) return prevTypingUsers

          if (isTyping) {
            // Add user to typing users if not already present
            if (!prevTypingUsers.some((u) => u.id === userId)) {
              return [...prevTypingUsers, { id: userId, username }]
            }
          } else {
            // Remove user from typing users
            return prevTypingUsers.filter((u) => u.id !== userId)
          }
          return prevTypingUsers
        })
      }
    },
    [user?.id],
  )

  // Set up message and typing status event listeners
  useEffect(() => {
    if (onNewMessage) {
      onNewMessage(handleNewMessage)
    }

    if (onTypingStatus) {
      onTypingStatus(handleTypingStatus)
    }

    // Handle message read status updates
    if (onMessageRead) {
      const handleMessageRead = ({ messageId, userId }) => {
        // Update local message read status
        setLocalMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, readBy: [...(msg.readBy || []), userId] }
              : msg,
          ),
        )
      }

      onMessageRead(handleMessageRead)
    }

    // Cleanup event listeners
    return () => {
      if (onNewMessage) {
        onNewMessage(null)
      }
      if (onTypingStatus) {
        onTypingStatus(null)
      }
      if (onMessageRead) {
        onMessageRead(null)
      }
    }
  }, [
    handleNewMessage,
    handleTypingStatus,
    onNewMessage,
    onTypingStatus,
    onMessageRead,
  ])

  // Update the input field and send typing status
  const handleMessageChange = (value) => {
    // Handle both direct string values and event objects
    const newValue = typeof value === 'string' ? value : value.target?.value

    setMessage(newValue)

    // Send typing status
    if (sendTypingStatus && conversationId) {
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Send "typing" status
      sendTypingStatus(conversationId, true)

      // Set a timeout to send "stopped typing" status after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        if (sendTypingStatus && conversationId) {
          sendTypingStatus(conversationId, false)
        }
      }, 2000)
    }
  }

  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!message.trim()) return

    // Create a temporary local message to show immediately
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: message,
      senderId: user?.id,
      sender: {
        id: user?.id,
        fullname: user?.fullname,
        avatar: user?.avatar,
      },
      createdAt: new Date().toISOString(),
      isLocal: true, // Flag to identify local messages
    }

    // Add the temporary message to the local state
    setLocalMessages((prev) => [...prev, tempMessage])

    // Reset the input field
    setMessage('')

    // Clear any typing status
    if (sendTypingStatus && conversationId) {
      sendTypingStatus(conversationId, false)
    }

    // Send the message via socket if connected
    if (isConnected) {
      // For group chats
      if (conversation?.type === 'GROUP' && sendGroupMessage) {
        sendGroupMessage(conversationId, message)
      }
      // For private chats
      else if (sendPrivateMessage) {
        // Find the other user in the conversation
        const otherUser = conversation?.members?.find((m) => m.id !== user?.id)
        if (otherUser) {
          sendPrivateMessage(otherUser.id, message, conversationId)
        }
      }
    }

    // Also send the message via API as a fallback
    sendMessageMutation({ content: message })

    // Scroll to bottom after sending
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  // Extract message groups from all pages
  const serverMessages = messagesPages?.pages
    ? messagesPages.pages.flatMap((page) => page.messages || page.data || [])
    : []

  // Combine server messages with local messages
  const allMessages = [...serverMessages, ...localMessages]
    // Remove duplicates based on id
    .filter(
      (message, index, self) =>
        index ===
        self.findIndex(
          (m) => (m.id || m._localId) === (message.id || message._localId),
        ),
    )
    // Sort by createdAt/timestamp
    .sort(
      (a, b) =>
        new Date(a.createdAt || a.timestamp || a.created_at) -
        new Date(b.createdAt || b.timestamp || b.created_at),
    )

  // Function to get receiver information for display
  const getReceiverInfo = () => {
    // If it's a group chat, use the conversation name and avatar
    if (conversation?.type === 'GROUP') {
      return {
        name: conversation.name || 'Group Chat',
        avatar: conversation.avatar || 'https://via.placeholder.com/40',
        isOnline: false, // Groups don't have online status
      }
    }
    // If it's a private chat, get the other user's info
    else {
      const otherMember = conversation?.members?.find((m) => m.id !== user?.id)
      return {
        name: otherMember?.fullname || 'User',
        avatar: otherMember?.avatar || 'https://via.placeholder.com/40',
        isOnline: otherMember?.isOnline || false,
      }
    }
  }

  const receiverInfo = getReceiverInfo()

  // Start a call with the conversation
  const handleStartCall = (isVideo = true) => {
    // Determine the receiver ID based on conversation type
    let receiverId

    if (conversation?.type === 'GROUP') {
      receiverId = conversation.id
    } else {
      const otherMember = conversation?.members?.find((m) => m.id !== user?.id)
      receiverId = otherMember?.id
    }

    if (!receiverId) {
      enqueueSnackbar('Cannot start call: receiver information not found', {
        variant: 'error',
      })
      return
    }

    console.log(
      'Starting call with receiverId:',
      receiverId,
      'isVideo:',
      isVideo,
    )

    try {
      // Initialize necessary call data
      const channelName = `call-${Date.now()}`

      // Build the URL for the call
      let callUrl = `/call/${channelName}?calleeId=${receiverId}&type=${isVideo ? 'video' : 'audio'}`

      // Store the current call info in the global state
      if (typeof window !== 'undefined') {
        // Create callState if it doesn't exist
        window.callState = window.callState || {
          currentCall: null,
          navigatingToCall: false,
        }

        // Set current call data
        window.callState.currentCall = {
          channelName,
          calleeId: receiverId,
          callerId: user?.id,
          callType: isVideo ? 'video' : 'audio',
          timestamp: Date.now(),
        }
        window.callState.navigatingToCall = true
      }

      console.log('Navigating to call page:', callUrl)

      // Navigate to the call page
      window.location.href = callUrl
    } catch (error) {
      console.error('Error starting call:', error)
      enqueueSnackbar('Call failed to start. Please try again.', {
        variant: 'error',
      })
    }
  }

  // Automatically scroll to bottom when first messages load or when changing conversations
  useEffect(() => {
    if (messagesEndRef.current && !isLoading && conversationId) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' })
    }
  }, [isLoading, conversationId])

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (
      messagesEndRef.current &&
      allMessages.length > prevLocalMessagesLength &&
      !isLoadingMore
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      setPrevLocalMessagesLength(allMessages.length)
    }
  }, [allMessages.length, prevLocalMessagesLength, isLoadingMore])

  return {
    message,
    setMessage,
    handleMessageChange, // Return both for flexibility
    allMessages,
    typingUsers,
    messagesEndRef,
    messagesContainerRef,
    handleSendMessage,
    handleStartCall,
    receiverInfo,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isConnected,
  }
}

export default useChat
