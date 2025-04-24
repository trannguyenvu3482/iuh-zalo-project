import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getConversationMessages, sendNewMessage } from '../api/apiMessage'
import { useSocket } from '../contexts/SocketContext'
import { useUser } from './useUser'

const MESSAGES_PER_PAGE = 20

export const useChat = (conversation, conversationId) => {
  const user = useUser()
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
    pendingMessages,
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
        console.log('Received new message for current conversation:', message)

        // Preserve the original sender name from the server first
        const originalSenderName =
          message.senderName ||
          (message.sender && typeof message.sender === 'object'
            ? message.sender.fullName
            : null)

        // Check if sender is an object or just an ID
        let senderObj = message.sender

        if (
          typeof message.sender === 'string' ||
          message.sender instanceof String
        ) {
          // If sender is just an ID, create a basic sender object
          senderObj = {
            id: message.sender,
            fullName: originalSenderName || 'Unknown User',
            avatar: null,
          }
        } else if (message.sender === null || message.sender === undefined) {
          // If sender is null/undefined but we have senderId and senderName
          if (message.senderId) {
            senderObj = {
              id: message.senderId,
              fullName: originalSenderName || 'Unknown User',
              avatar: message.avatar || null,
            }
          }
        } else if (typeof message.sender === 'object') {
          // Ensure sender object has fullName
          senderObj = {
            ...message.sender,
            fullName:
              originalSenderName || message.sender.fullName || 'Unknown User',
          }
        }

        console.log('Normalized sender object:', senderObj)

        // Normalize the message format to ensure consistency
        const normalizedMessage = {
          ...message,
          id:
            message.id ||
            `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          // Ensure both field formats are present
          content: message.content || message.message,
          message: message.message || message.content,
          // Always keep the sender ID separately
          senderId: message.senderId || (senderObj && senderObj.id),
          // Keep or construct the sender object
          sender: senderObj,
          // Make sure to keep the sender name explicit
          senderName:
            originalSenderName ||
            (senderObj && senderObj.fullName) ||
            'Unknown User',
          timestamp:
            message.timestamp || message.created_at || new Date().toISOString(),
          created_at:
            message.created_at || message.timestamp || new Date().toISOString(),
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
            (senderObj && senderObj.id === user?.id),
        }

        // Add the message to local state, avoiding duplicates
        setLocalMessages((prev) => {
          // More robust duplicate detection
          const isDuplicate = prev.some(
            (m) =>
              (m.id && m.id === normalizedMessage.id) || // Same ID
              // Or same content, sender and similar timestamp (within 2 seconds)
              (m.content === normalizedMessage.content &&
                m.senderId === normalizedMessage.senderId &&
                Math.abs(
                  new Date(m.timestamp || m.created_at) -
                    new Date(
                      normalizedMessage.timestamp ||
                        normalizedMessage.created_at,
                    ),
                ) < 2000),
          )

          if (isDuplicate) {
            console.log('Duplicate message detected, not adding to local state')
            return prev
          }

          console.log('Adding new message to local state', normalizedMessage)
          return [...prev, normalizedMessage]
        })

        // Immediately invalidate the query cache to force a refresh
        // This ensures that even if the socket message doesn't update the UI,
        // the query will fetch the latest messages
        if (!message.isFromCurrentUser) {
          setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: ['messages', currentConversationId],
            })
          }, 100)
        }

        // Mark the message as read if it's not from the current user
        if (
          !normalizedMessage.isSystemMessage &&
          !normalizedMessage.isFromCurrentUser &&
          normalizedMessage.id
        ) {
          markMessageAsRead(normalizedMessage.id, currentConversationId)
        }
      }
    },
    [user?.id, markMessageAsRead, queryClient],
  )

  // Handle typing status updates
  const handleTypingStatus = useCallback(
    (data) => {
      const currentConversationId = activeConversationIdRef.current

      // Only update typing status if it's for the current conversation
      if (data.conversationId === currentConversationId) {
        const { userId, isTyping, fullName } = data

        setTypingUsers((prevTypingUsers) => {
          // Don't show typing indicator for the current user
          if (userId === user?.id) return prevTypingUsers

          if (isTyping) {
            // Add user to typing users if not already present
            if (!prevTypingUsers.some((u) => u.id === userId)) {
              return [...prevTypingUsers, { id: userId, fullName }]
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
    // Only set up handlers if the conversation ID is available
    if (!conversationId) return

    console.log(
      `Setting up message listeners for conversation: ${conversationId}`,
    )

    // Message handler registration
    let messageUnsubscribe = null
    if (onNewMessage) {
      messageUnsubscribe = onNewMessage(handleNewMessage)
      console.log('Registered new message handler')
    }

    // Typing status handler registration
    let typingUnsubscribe = null
    if (onTypingStatus) {
      typingUnsubscribe = onTypingStatus(handleTypingStatus)
      console.log('Registered typing status handler')
    }

    // Message read status handler registration
    let messageReadUnsubscribe = null
    if (onMessageRead) {
      const handleMessageRead = ({ messageId, userId }) => {
        console.log(`Message ${messageId} read by user ${userId}`)
        // Update local message read status
        setLocalMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, readBy: [...(msg.readBy || []), userId] }
              : msg,
          ),
        )
      }

      messageReadUnsubscribe = onMessageRead(handleMessageRead)
      console.log('Registered message read handler')
    }

    // Cleanup event listeners when component unmounts or conversationId changes
    return () => {
      console.log(
        `Cleaning up message listeners for conversation: ${conversationId}`,
      )

      if (messageUnsubscribe) {
        messageUnsubscribe()
        console.log('Unregistered message handler')
      }

      if (typingUnsubscribe) {
        typingUnsubscribe()
        console.log('Unregistered typing status handler')
      }

      if (messageReadUnsubscribe) {
        messageReadUnsubscribe()
        console.log('Unregistered message read handler')
      }
    }
  }, [
    conversationId,
    handleNewMessage,
    handleTypingStatus,
    onNewMessage,
    onTypingStatus,
    onMessageRead,
  ])

  // Update the input field and send typing status
  const handleMessageChange = useCallback(
    (newValue) => {
      console.log('newValue', newValue)

      setMessage(newValue || '')
      console.log('useChat updating message to:', newValue)

      if (sendTypingStatus && conversationId) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }

        sendTypingStatus(conversationId, true)

        typingTimeoutRef.current = setTimeout(() => {
          if (sendTypingStatus && conversationId) {
            sendTypingStatus(conversationId, false)
          }
        }, 2000)
      }
    },
    [sendTypingStatus, conversationId],
  )

  // More intelligent scroll handling - only scroll for new messages, not typing
  const shouldScrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return false

    // Check if we're already near the bottom (within 200px)
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      200

    return isNearBottom
  }, [])

  // Memoized calculation for combining server and local messages
  const allMessages = useMemo(() => {
    console.log('Recomputing allMessages')

    // Get messages from all sources
    const serverMessages = messagesPages
      ? messagesPages.pages.flatMap((page) => page.messages || [])
      : []

    // Log counts for debugging
    console.log(
      `Combining sources: ${serverMessages.length} server messages, ${localMessages.length} local messages`,
    )

    // When we have messages from multiple sources, combine them with sophisticated deduplication
    const combined = [...serverMessages, ...localMessages]

    // Create a map to deduplicate messages
    const uniqueMessages = new Map()

    // Process all messages
    combined.forEach((msg) => {
      if (!msg) return // Skip null/undefined messages

      // Get consistent values for comparison
      const messageId = msg.id || msg._localId
      const content = msg.content || msg.message || ''
      const senderId =
        msg.senderId ||
        (typeof msg.sender === 'string' ? msg.sender : msg.sender?.id)
      const timestamp =
        msg.timestamp ||
        msg.created_at ||
        msg.createdAt ||
        new Date().toISOString()

      // Use a combination of id, content and sender as the key
      const key = messageId || `${senderId}:${content}:${timestamp}`

      // Skip messages without content or necessary identifiers
      if (!content && !messageId) return

      // Prefer server messages (with IDs) over local ones, but newer messages over older ones
      const existingMsg = uniqueMessages.get(key)
      const shouldReplace =
        !existingMsg ||
        (msg.id && !existingMsg.id) ||
        new Date(msg.timestamp || msg.created_at || msg.createdAt || 0) >
          new Date(
            existingMsg.timestamp ||
              existingMsg.created_at ||
              existingMsg.createdAt ||
              0,
          )

      if (shouldReplace) {
        // Normalize and enhance message format to include proper sender info
        let senderObj = msg.sender

        // Preserve the original sender name from the server
        const originalSenderName =
          msg.senderName ||
          (msg.sender && typeof msg.sender === 'object'
            ? msg.sender.fullName
            : null)

        // Convert string/ID sender to object with name
        if (typeof msg.sender === 'string' || msg.sender instanceof String) {
          senderObj = {
            id: msg.sender,
            fullName: originalSenderName || 'Unknown User',
          }
        }
        // If sender is null but we have senderId and senderName
        else if (msg.sender === null || msg.sender === undefined) {
          if (msg.senderId) {
            senderObj = {
              id: msg.senderId,
              fullName: originalSenderName || 'Unknown User',
            }
          }
        }
        // If sender object exists but missing name
        else if (typeof msg.sender === 'object' && msg.sender) {
          senderObj = {
            ...msg.sender,
            fullName:
              originalSenderName || msg.sender.fullName || 'Unknown User',
          }
        }

        console.log(
          'Normalizing message sender from:',
          msg.sender,
          'to:',
          senderObj,
        )

        const normalizedMsg = {
          ...msg,
          id:
            msg.id ||
            `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: msg.content || msg.message,
          message: msg.message || msg.content,
          senderId:
            msg.senderId ||
            (typeof msg.sender === 'string' ? msg.sender : msg.sender?.id),
          sender: senderObj,
          senderName:
            originalSenderName ||
            (senderObj && senderObj.fullName) ||
            'Unknown User',
          timestamp:
            msg.timestamp ||
            msg.created_at ||
            msg.createdAt ||
            new Date().toISOString(),
          created_at:
            msg.created_at ||
            msg.timestamp ||
            msg.createdAt ||
            new Date().toISOString(),
          isFromCurrentUser:
            msg.isFromCurrentUser ||
            msg.senderId === user?.id ||
            (typeof msg.sender === 'string' && msg.sender === user?.id) ||
            (msg.sender && msg.sender.id === user?.id),
        }

        uniqueMessages.set(key, normalizedMsg)
      }
    })

    // Convert map to array and sort by timestamp
    const result = Array.from(uniqueMessages.values())
      .filter((msg) => msg && (msg.content || msg.message)) // Remove any empty messages
      .sort((a, b) => {
        const timeA = new Date(
          a.timestamp || a.created_at || a.createdAt || 0,
        ).getTime()
        const timeB = new Date(
          b.timestamp || b.created_at || b.createdAt || 0,
        ).getTime()
        return timeA - timeB
      })

    console.log(`Combined and deduplicated to ${result.length} messages`)

    return result
  }, [messagesPages, localMessages, user?.id])

  // Handle sending a message
  const handleSendMessage = (
    e,
    type = 'TEXT',
    content = message,
    replyToMessage = null,
  ) => {
    console.log('handleSendMessage', e, type, content)

    if (e) {
      e.preventDefault()
    }

    if (!content.trim()) return

    // Create a temporary local message to show immediately
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: content,
      senderId: user?.id,
      sender: {
        id: user?.id,
        fullName: user?.fullName,
        avatar: user?.avatar,
      },
      createdAt: new Date().toISOString(),
      isLocal: true, // Flag to identify local messages
      type: type,
    }

    // Add reply info if provided
    if (replyToMessage) {
      tempMessage.replyToId = replyToMessage.id
      tempMessage.replyToMessage = replyToMessage
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
        sendGroupMessage(conversationId, content)
      }
      // For private chats
      else if (sendPrivateMessage) {
        // Find the other user in the conversation
        const otherUser = conversation?.members?.find((m) => m.id !== user?.id)
        if (otherUser) {
          sendPrivateMessage(otherUser.id, content, conversationId)
        }
      }
    }

    // Also send the message via API as a fallback
    sendMessageMutation({ content })

    // Only scroll to bottom if we were already at the bottom
    if (shouldScrollToBottom()) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }

  // Function to get receiver information for display
  const getReceiverInfo = () => {
    // If it's a group chat, use the conversation name and avatar
    if (conversation?.type === 'GROUP') {
      return {
        id: conversation.id,
        fullName: conversation.name || 'Group Chat',
        avatar: conversation.avatar || 'https://via.placeholder.com/40',
        isOnline: false, // Groups don't have online status
      }
    }
    // If it's a private chat, get the other user's info
    else {
      const otherMember = conversation?.members?.find((m) => m.id !== user?.id)
      return {
        id: otherMember?.id,
        fullName: otherMember?.fullName || 'User',
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

  // Effect to sync pendingMessages to localMessages for the current conversation
  useEffect(() => {
    if (!conversationId || !pendingMessages || pendingMessages.length === 0)
      return

    console.log('Processing pending messages for conversation:', conversationId)

    // Filter messages for this conversation
    const relevantMessages = pendingMessages.filter(
      (msg) => msg.conversationId === conversationId,
    )

    if (relevantMessages.length === 0) return

    console.log(
      `Found ${relevantMessages.length} pending messages for current conversation`,
    )

    // Add messages to local state, avoiding duplicates
    setLocalMessages((prevMessages) => {
      const uniqueMessages = [...prevMessages]
      let addedCount = 0

      relevantMessages.forEach((msg) => {
        // Check if this message already exists in our state
        const isDuplicate = prevMessages.some(
          (existingMsg) =>
            (existingMsg.id && existingMsg.id === msg.id) ||
            (existingMsg.content === (msg.content || msg.message) &&
              existingMsg.senderId === (msg.senderId || msg.sender?.id) &&
              Math.abs(
                new Date(
                  existingMsg.timestamp ||
                    existingMsg.created_at ||
                    existingMsg.createdAt,
                ) -
                  new Date(
                    msg.timestamp ||
                      msg.created_at ||
                      msg.createdAt ||
                      new Date(),
                  ),
              ) < 2000),
        )

        if (!isDuplicate) {
          // Normalize and enhance message format to include proper sender info
          let senderObj = msg.sender

          // Preserve the original sender name from the server
          const originalSenderName =
            msg.senderName ||
            (msg.sender && typeof msg.sender === 'object'
              ? msg.sender.fullName
              : null)

          // Convert string/ID sender to object with name
          if (typeof msg.sender === 'string' || msg.sender instanceof String) {
            senderObj = {
              id: msg.sender,
              fullName: originalSenderName || 'Unknown User',
            }
          }
          // If sender is null but we have senderId and senderName
          else if (msg.sender === null || msg.sender === undefined) {
            if (msg.senderId) {
              senderObj = {
                id: msg.senderId,
                fullName: originalSenderName || 'Unknown User',
              }
            }
          }
          // If sender object exists but missing name
          else if (typeof msg.sender === 'object' && msg.sender) {
            senderObj = {
              ...msg.sender,
              fullName:
                originalSenderName || msg.sender.fullName || 'Unknown User',
            }
          }

          console.log(
            'Normalizing message sender from:',
            msg.sender,
            'to:',
            senderObj,
          )

          const normalizedMsg = {
            ...msg,
            id:
              msg.id ||
              `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            content: msg.content || msg.message,
            message: msg.message || msg.content,
            senderId:
              msg.senderId ||
              (typeof msg.sender === 'string' ? msg.sender : msg.sender?.id),
            sender: senderObj,
            senderName:
              originalSenderName ||
              (senderObj && senderObj.fullName) ||
              'Unknown User',
            timestamp:
              msg.timestamp ||
              msg.created_at ||
              msg.createdAt ||
              new Date().toISOString(),
            created_at:
              msg.created_at ||
              msg.timestamp ||
              msg.createdAt ||
              new Date().toISOString(),
            isFromCurrentUser:
              msg.isFromCurrentUser ||
              msg.senderId === user?.id ||
              (typeof msg.sender === 'string' && msg.sender === user?.id) ||
              (msg.sender && msg.sender.id === user?.id),
          }

          uniqueMessages.push(normalizedMsg)
          addedCount++
        }
      })

      if (addedCount > 0) {
        console.log(`Added ${addedCount} new messages from pendingMessages`)
        // Force the query to refetch in the background to ensure consistency
        queryClient.invalidateQueries({
          queryKey: ['messages', conversationId],
          refetchType: 'none', // Just mark as stale but don't refetch immediately
        })

        return uniqueMessages
      }

      return prevMessages
    })
  }, [conversationId, pendingMessages, user?.id, queryClient])

  // Scroll to bottom when new messages are added, but only if we're near the bottom already
  useEffect(() => {
    if (
      messagesEndRef.current &&
      allMessages.length > prevLocalMessagesLength &&
      !isLoadingMore &&
      shouldScrollToBottom() // Only scroll if we're already near the bottom
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      setPrevLocalMessagesLength(allMessages.length)
    } else if (allMessages.length > prevLocalMessagesLength) {
      // Just update the counter even if we don't scroll
      setPrevLocalMessagesLength(allMessages.length)
    }
  }, [
    allMessages.length,
    prevLocalMessagesLength,
    isLoadingMore,
    shouldScrollToBottom,
  ])

  // Debug effect to monitor message updates and force refresh if needed
  useEffect(() => {
    // Skip if no conversation ID or during loading
    if (!conversationId || isLoading) return

    // Check if we have pending messages that should be displayed
    const hasPendingForConversation = pendingMessages?.some(
      (msg) => msg.conversationId === conversationId,
    )

    console.log(`[Debug] Conversation ${conversationId}:`, {
      messagesCount: allMessages.length,
      localMessagesCount: localMessages.length,
      pendingMessagesCount: pendingMessages?.length || 0,
      hasPendingForConversation,
      isLoading,
    })

    // If we have pending messages for this conversation but they're not in allMessages
    // force a refresh to make sure they get displayed
    if (
      hasPendingForConversation &&
      pendingMessages.length > 0 &&
      allMessages.length === 0
    ) {
      console.log(
        '[Debug] Detected pending messages not showing in UI, forcing refresh',
      )

      // Force refresh the queries
      queryClient.invalidateQueries({
        queryKey: ['messages', conversationId],
      })

      // Also directly process the pending messages into local messages
      const relevantMessages = pendingMessages.filter(
        (msg) => msg.conversationId === conversationId,
      )

      if (relevantMessages.length > 0) {
        console.log(
          `[Debug] Directly adding ${relevantMessages.length} messages to local state`,
        )
        setLocalMessages((prev) => [
          ...prev,
          ...relevantMessages.map((msg) => ({
            ...msg,
            id:
              msg.id ||
              `force-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            content: msg.content || msg.message,
            message: msg.message || msg.content,
          })),
        ])
      }
    }
  }, [
    conversationId,
    allMessages.length,
    pendingMessages,
    localMessages.length,
    isLoading,
    queryClient,
  ])

  // Return functions for the component to use
  return {
    message,
    setMessage: handleMessageChange,
    allMessages,
    typingUsers,
    messagesEndRef,
    messagesContainerRef,
    handleSendMessage,
    handleStartCall,
    receiverInfo,
    isLoading,
    isFetchingNextPage,
    isConnected,
  }
}

export default useChat
