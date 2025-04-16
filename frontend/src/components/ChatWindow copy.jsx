import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import PropTypes from 'prop-types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getConversationMessages, sendNewMessage } from '../api/apiMessage'
import { useSocket } from '../contexts/SocketContext'
import { useUserStore } from '../zustand/userStore'
import ChatMessage from './ChatMessage'
import SystemMessage from './SystemMessage'

const MESSAGES_PER_PAGE = 20

const ChatWindow = ({ conversation }) => {
  const { id: conversationId } = useParams()
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
      console.log('Setting active conversation in ChatWindow:', conversationId)
      setActiveConversation(conversationId)

      // Clear active conversation when component unmounts
      return () => {
        console.log('Clearing active conversation')
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
    queryFn: ({ pageParam = 0 }) =>
      getConversationMessages(conversationId, {
        limit: MESSAGES_PER_PAGE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.offset + lastPage.pagination.limit
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

      if (message.conversationId === currentConversationId) {
        // Check if sender is an object or just an ID
        let senderObj = message.sender
        if (
          typeof message.sender === 'string' ||
          message.sender instanceof String
        ) {
          // If sender is just an ID, create a basic sender object
          senderObj = {
            id: message.sender,
            fullName: message.senderName || 'Unknown User',
            avatar: null,
          }
        }

        // Normalize the message format to ensure consistency
        const normalizedMessage = {
          ...message,
          // Ensure both field formats are present
          content: message.content || message.message,
          message: message.message || message.content,
          // Always keep the sender ID separately
          senderId: message.senderId || (senderObj && senderObj.id),
          // Keep or construct the sender object
          sender: senderObj,
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
            (senderObj && senderObj.id === user?.id),
        }

        // Simply add the message to local state for immediate display
        // with a simple check to prevent exact duplicates
        setLocalMessages((prev) => {
          const isDuplicate = prev.some(
            (m) =>
              (m.id && m.id === message.id) ||
              (m.content === (message.content || message.message) &&
                m.senderId ===
                  (message.senderId ||
                    (typeof message.sender === 'string'
                      ? message.sender
                      : message.sender?.id))),
          )

          if (isDuplicate) {
            return prev
          }

          return [...prev, normalizedMessage]
        })

        // Mark as read only for non-system messages from other users
        if (
          !normalizedMessage.isSystemMessage &&
          normalizedMessage.senderId !== user?.id &&
          senderObj &&
          senderObj.id !== user?.id &&
          normalizedMessage.id
        ) {
          markMessageAsRead(normalizedMessage.id, currentConversationId)
        }
      }
    },
    [user?.id, markMessageAsRead],
  )

  // Listen for new messages
  useEffect(() => {
    if (!conversationId) return

    // Subscribe to new message events
    const unsubscribe = onNewMessage(handleNewMessage)

    return () => {
      unsubscribe()
    }
  }, [conversationId, onNewMessage, handleNewMessage])

  // Memoize the typing status handler
  const handleTypingStatus = useCallback(
    ({ conversationId: typingConversationId, userId, userName, isTyping }) => {
      if (
        typingConversationId === activeConversationIdRef.current &&
        userId !== user?.id
      ) {
        if (isTyping) {
          setTypingUsers((prev) =>
            prev.find((u) => u.id === userId)
              ? prev
              : [...prev, { id: userId, name: userName }],
          )
        } else {
          setTypingUsers((prev) => prev.filter((u) => u.id !== userId))
        }
      }
    },
    [user?.id],
  )

  // Handle typing status
  useEffect(() => {
    if (!conversationId) return

    // Subscribe to typing status events
    const unsubscribe = onTypingStatus(handleTypingStatus)

    return () => {
      unsubscribe()
    }
  }, [conversationId, onTypingStatus, handleTypingStatus])

  // Memoize the message read handler
  const handleMessageRead = useCallback(({ messageId, userId }) => {
    // Update local message read status
    setLocalMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, readBy: [...(msg.readBy || []), userId] }
          : msg,
      ),
    )
  }, [])

  // Add message read status tracking
  useEffect(() => {
    if (!conversationId) return

    // Subscribe to message read events
    const unsubscribe = onMessageRead(handleMessageRead)

    return () => {
      unsubscribe()
    }
  }, [conversationId, onMessageRead, handleMessageRead])

  // Combine server-fetched messages and local messages with stronger deduplication
  const allMessages = (() => {
    if (!messagesPages) return localMessages

    // Get all messages from both sources - flatten all pages into a single array
    const allServerMessages = messagesPages.pages.flatMap(
      (page) => page.messages || [],
    )
    const combined = [...allServerMessages, ...localMessages]

    // Create a map to deduplicate messages
    const uniqueMessages = new Map()

    // Process all messages
    combined.forEach((msg) => {
      const messageId = msg.id || msg._localId
      const content = msg.content || msg.message
      const senderId =
        msg.senderId ||
        (typeof msg.sender === 'string' ? msg.sender : msg.sender?.id)

      // Use a combination of id, content and sender as the key
      const key = messageId
        ? messageId
        : `${senderId}:${content}:${msg.timestamp || msg.created_at}`

      // Prefer server messages (with IDs) over local ones
      if (!uniqueMessages.has(key) || !uniqueMessages.get(key).id) {
        uniqueMessages.set(key, {
          ...msg,
          isFromCurrentUser:
            msg.isFromCurrentUser ||
            (typeof msg.sender === 'string' && msg.sender === user?.id) ||
            (msg.sender && msg.sender.id === user?.id) ||
            msg.senderId === user?.id,
        })
      }
    })

    // Convert map to array and sort by timestamp
    return Array.from(uniqueMessages.values()).sort(
      (a, b) =>
        new Date(a.timestamp || a.created_at) -
        new Date(b.timestamp || b.created_at),
    )
  })()

  // Log messages for debugging
  useEffect(() => {
    const serverMessages =
      messagesPages?.pages?.flatMap((page) => page.messages || []) || []
    console.log('Local messages:', localMessages)
    console.log('Server messages:', serverMessages)
    console.log('Combined messages:', allMessages)
  }, [allMessages, localMessages, messagesPages])

  // Typing indicator component
  const TypingIndicator = () => {
    if (typingUsers.length === 0) return null

    const names = typingUsers.map((u) => u.name).join(', ')
    return (
      <div className="px-4 py-2 text-xs italic text-gray-500">
        {typingUsers.length === 1
          ? `${names} đang nhập...`
          : 'Những người khác đang nhập...'}
      </div>
    )
  }

  // Get the other user's name for 1:1 chat display
  const getReceiverInfo = () => {
    if (conversation?.type === 'GROUP') {
      return {
        id: conversation?.id,
        name: conversation?.name || 'Group Chat',
        avatar:
          conversation?.avatar || 'https://avatar.iran.liara.run/public/45',
        isOnline: true, // Would need to check members' online status
      }
    } else {
      // First check if members array exists and has entries
      if (!conversation?.members || conversation.members.length === 0) {
        return {
          id: conversation?.id,
          name: conversation?.name || 'Unknown Contact',
          avatar:
            conversation?.avatar || 'https://avatar.iran.liara.run/public/44',
          isOnline: false,
        }
      }

      // Filter out the current user
      const otherMembers = conversation.members.filter((m) => m.id !== user?.id)

      // Use the first other member, or fallback if no other members are found
      const otherMember = otherMembers.length > 0 ? otherMembers[0] : null

      return {
        id: otherMember?.id || conversation?.id,
        name: otherMember?.fullname || conversation?.name || 'Contact',
        avatar:
          otherMember?.avatar ||
          conversation?.avatar ||
          'https://avatar.iran.liara.run/public/44',
        isOnline: otherMember?.status === 'ONLINE',
      }
    }
  }

  const receiverInfo = getReceiverInfo()

  // Scroll to bottom when messages change - ONLY for new messages, not when loading old ones
  useEffect(() => {
    // Track when new local messages are added
    if (localMessages.length > prevLocalMessagesLength) {
      setPrevLocalMessagesLength(localMessages.length)

      // When a new local message is added (user sent a message), scroll to bottom
      if (messagesEndRef.current && !isLoadingMore) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    } else if (!isLoadingMore && messagesEndRef.current) {
      // For server messages, only scroll if we're already at the bottom
      const container = messagesContainerRef.current
      const isAtBottom =
        container &&
        container.scrollHeight - container.scrollTop - container.clientHeight <
          100

      if (isAtBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [localMessages.length, isLoadingMore, prevLocalMessagesLength])

  // Handle message input change
  const handleMessageChange = (e) => {
    setMessage(e.target.value)

    // Send typing status
    if (conversationId) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Send typing status
      sendTypingStatus(conversationId, true)

      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(conversationId, false)
      }, 2000)
    }
  }

  // Handle message send
  const handleSendMessage = (e) => {
    e.preventDefault()

    if (!message.trim() || !conversationId || !isConnected) return

    // Create message object with both field formats for consistency
    const newMessage = {
      content: message,
      message: message, // Add message field to match backend format
      senderId: user?.id,
      sender: user?.id, // Add sender field to match backend format
      senderName: user?.fullname || user?.name,
      conversationId,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(), // Add created_at to match backend format
      // Add a temporary local ID that we can use to identify and replace the message later
      _localId: Date.now().toString(),
      isFromCurrentUser: true, // Flag to identify this is sent by current user
    }

    // Determine if this is a private or group conversation
    if (conversation?.type === 'GROUP') {
      // Send group message via socket
      sendGroupMessage(conversationId, message)
    } else {
      // Filter out the current user from members
      const otherMembers = conversation?.members?.filter(
        (m) => m.id !== user?.id,
      )
      // Use the first other member, or fallback
      const receiverId = otherMembers?.[0]?.id

      if (receiverId) {
        // Send private message via socket
        sendPrivateMessage(receiverId, message)
      } else {
        console.error('Could not find receiver ID for private message')
      }
    }

    // Add to local messages for immediate display
    setLocalMessages((prev) => [...prev, newMessage])
    console.log('Added new message to localMessages:', newMessage)

    // Send via API (onSuccess is already configured with a delay)
    sendMessageMutation({
      conversationId,
      content: message,
    })

    // Clear input and typing status
    setMessage('')
    sendTypingStatus(conversationId, false)
    clearTimeout(typingTimeoutRef.current)
  }

  // Method to handle video/audio call initiation
  const handleStartCall = (isVideo = true) => {
    // Import the call utilities
    import('../utils/callUtils')
      .then(({ ensureCallFunctionalityAvailable, initiateCall }) => {
        console.log('Attempting to start call')
        console.log('Socket connected:', isConnected)
        console.log('Receiver info:', receiverInfo)

        if (!receiverInfo || !receiverInfo.id) {
          enqueueSnackbar('Cannot start call: receiver information not found', {
            variant: 'error',
          })
          return
        }

        // Ensure the global function is available or use our fallback
        ensureCallFunctionalityAvailable()

        try {
          // Use the global initiateAgoraCall function if available, otherwise use our direct implementation
          if (window.initiateAgoraCall) {
            console.log('Using window.initiateAgoraCall function')
            const result = window.initiateAgoraCall(receiverInfo.id, isVideo)

            // If call initialization failed or CallManager is not showing the UI
            if (!result) {
              throw new Error('Call initialization failed')
            }

            // Force remount of CallManager if available
            if (window.remountCallManager) {
              window.remountCallManager()
            }
          } else {
            console.log('Using direct call implementation')
            const callStarted = initiateCall(receiverInfo.id, isVideo)
            if (!callStarted) {
              throw new Error('Call initialization failed')
            }
          }
        } catch (error) {
          console.error('Error starting call:', error)
          enqueueSnackbar('Call failed to start. Please try again.', {
            variant: 'error',
          })
        }
      })
      .catch((error) => {
        console.error('Error importing call utilities:', error)
        enqueueSnackbar('Call functionality not available', {
          variant: 'error',
        })
      })
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Chat Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={receiverInfo.avatar}
              alt={receiverInfo.name}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium">{receiverInfo.name}</h3>
              <span className="text-xs text-gray-500">
                {receiverInfo.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {/* Audio Call Button */}
            <button
              className="rounded-full p-2 hover:bg-gray-100"
              onClick={() => handleStartCall(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-gray-600"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Video Call Button */}
            <button
              className="rounded-full p-2 hover:bg-gray-100"
              onClick={() => handleStartCall(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-gray-600"
              >
                <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
              </svg>
            </button>

            {/* Menu Button */}
            <button className="rounded-full p-2 hover:bg-gray-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-gray-600"
              >
                <path
                  fillRule="evenodd"
                  d="M10.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0Zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0Zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto bg-gray-50 p-4"
        ref={messagesContainerRef}
      >
        {/* Loading indicator for initial load */}
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <span className="loading loading-spinner loading-md text-primary mx-auto mb-2 block"></span>
              <p className="text-sm text-gray-500">Đang tải tin nhắn...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Loading indicator when fetching more messages */}
            {isFetchingNextPage && (
              <div className="sticky top-0 z-10 flex justify-center py-2">
                <div className="flex items-center rounded-full bg-white px-4 py-2 shadow-md">
                  <span className="loading loading-spinner loading-sm text-primary"></span>
                  <span className="ml-2 text-xs text-gray-600">
                    Đang tải tin nhắn cũ hơn...
                  </span>
                </div>
              </div>
            )}

            {/* Show a message when there are no more messages to load */}
            {!hasNextPage && allMessages.length > 0 && (
              <div className="mb-4 mt-1 text-center">
                <span className="inline-block rounded-full bg-gray-100 px-4 py-1 text-xs text-gray-500">
                  Bạn đã xem toàn bộ tin nhắn
                </span>
              </div>
            )}

            {/* Messages */}
            {allMessages.map((msg, index) => {
              const isLastMessage = index === allMessages.length - 1

              return msg.isSystemMessage || msg.type === 'SYSTEM' ? (
                <SystemMessage key={msg.id || index} message={msg} />
              ) : (
                <ChatMessage
                  key={msg.id || `local-${index}`}
                  message={msg}
                  isLastMessage={isLastMessage}
                />
              )
            })}

            {/* Typing indicator */}
            <TypingIndicator />

            {/* Invisible element for scrolling to bottom */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 0 0-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634Zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 0 1-.189-.866c0-.298.059-.605.189-.866Zm2.023 6.828a.75.75 0 1 0-1.06-1.06 3.75 3.75 0 0 1-5.304 0 .75.75 0 0 0-1.06 1.06 5.25 5.25 0 0 0 7.424 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <input
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-full border border-gray-300 bg-gray-100 px-4 py-2 focus:border-primary-blue focus:outline-none"
          />

          <button
            type="submit"
            disabled={!message.trim()}
            className={`rounded-full p-2 ${
              message.trim()
                ? 'bg-primary-blue text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="absolute bottom-20 left-0 right-0 bg-red-100 p-2 text-center text-xs text-red-600">
          Mất kết nối. Đang kết nối lại...
        </div>
      )}
    </div>
  )
}

ChatWindow.propTypes = {
  conversation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    type: PropTypes.oneOf(['PRIVATE', 'GROUP']),
    members: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        fullname: PropTypes.string,
        avatar: PropTypes.string,
      }),
    ),
    avatar: PropTypes.string,
  }),
}

export default ChatWindow
