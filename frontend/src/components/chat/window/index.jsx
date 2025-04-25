import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useQueryClient } from '@tanstack/react-query'
import GifPicker from 'gif-picker-react'
import PropTypes from 'prop-types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useChat from '../../../hooks/useChat'
import { useUser } from '../../../hooks/useUser'
import instance from '../../../service/axios'
import { reconnectSocket } from '../../../service/socket'
import ProfileDialog from '../../Sidebar/ProfileDialog'
import ChatHeader from './ChatHeader'
import ChatSidebar from './ChatSidebar'
import MessageInput from './MessageInput'
import MessagesList from './MessagesList'

const ChatWindow = ({ conversation }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useUser()
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [firstMessage, setFirstMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [localMediaMessages, setLocalMediaMessages] = useState([])
  const [replyMessage, setReplyMessage] = useState(null)

  // Add a flag to prevent auto scrolling during certain actions
  const preventScrollRef = useRef(false)

  // Always call useChat to avoid conditional hooks
  const chatData = useChat(conversation, conversation?.id || '')

  // Log the key values returned from useChat for debugging
  console.log('ChatWindow received from useChat:', {
    messageValue: chatData.message,
    isConnected: chatData.isConnected,
  })

  // Handle new conversation case (no ID yet)
  const isNewConversation = conversation?.isNew === true

  // Ensure socket is connected when the chat window mounts
  useEffect(() => {
    if (conversation?.id) {
      console.log('ChatWindow mounted for conversation:', conversation.id)

      // Force reconnect socket to ensure we're getting real-time updates
      reconnectSocket()

      // Invalidate the message queries to ensure latest data
      queryClient.invalidateQueries({
        queryKey: ['messages', conversation.id],
        refetchType: 'all',
      })
    }
  }, [conversation?.id, queryClient])

  // Combine server messages with local media messages - wrapped in useMemo
  const allMessagesWithMedia = useMemo(() => {
    return chatData.allMessages
      ? [...chatData.allMessages, ...localMediaMessages]
          .filter(
            (message, index, self) =>
              index ===
              self.findIndex(
                (m) =>
                  m.id === message.id ||
                  (m.isLocal &&
                    message.isLocal &&
                    m.createdAt === message.createdAt),
              ),
          )
          .sort(
            (a, b) =>
              new Date(a.createdAt || a.timestamp || a.created_at) -
              new Date(b.createdAt || b.timestamp || b.created_at),
          )
      : []
  }, [chatData.allMessages, localMediaMessages])

  // Reference to track whether initial scroll has happened
  const initialScrollRef = useRef(false)

  // Effect to scroll to bottom when message list first loads or changes
  useEffect(() => {
    if (
      !isNewConversation &&
      allMessagesWithMedia.length > 0 &&
      chatData?.messagesEndRef?.current &&
      !preventScrollRef.current // Don't scroll if prevented
    ) {
      // Scroll to bottom after initial load or when new messages arrive
      if (
        !initialScrollRef.current ||
        chatData.messagesContainerRef?.current?.scrollTop > 0
      ) {
        setTimeout(() => {
          chatData.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
          initialScrollRef.current = true
        }, 150)
      }
    }
  }, [
    isNewConversation,
    allMessagesWithMedia,
    chatData?.messagesEndRef,
    chatData?.messagesContainerRef,
  ])

  // Open profile dialog
  const openProfileDialog = (user) => {
    console.log('openProfileDialog called with user:', user)

    // Make sure to only pass the user ID to open other user's profiles
    // Don't pass additional data that would make it look like the current user
    if (user && user.id) {
      const userToOpen = {
        id: user.id,
        fullName: user.fullName || user.name,
        avatar: user.avatar,
      }

      console.log('Setting selectedUser to:', userToOpen)
      setSelectedUser(userToOpen)
      setIsProfileDialogOpen(true)
    } else {
      console.error('Cannot open profile dialog: Missing user or user ID')
    }
  }

  // Auto scroll when GIF picker is closed
  useEffect(() => {
    // Only auto-scroll when closing the GIF picker AFTER sending a GIF
    // Don't scroll when just opening/closing the picker for browsing
    if (
      !showGifPicker &&
      !preventScrollRef.current &&
      localMediaMessages.length > 0
    ) {
      // Check if there was a recent GIF message to determine if we should scroll
      const hasRecentGif = localMediaMessages.some(
        (msg) =>
          msg.type === 'GIF' &&
          Date.now() - new Date(msg.createdAt).getTime() < 1000,
      )

      if (hasRecentGif) {
        setTimeout(scrollToBottom, 200)
      }
    }
  }, [showGifPicker, localMediaMessages])

  // Handle GIF selection from the GIF picker
  const handleGifSelect = (gif) => {
    // We'll handle scroll in the message sending logic, not here
    if (isNewConversation) {
      handleNewConversationMessage({
        type: 'GIF',
        content: gif.url,
      })
    } else {
      // For existing conversations, use our unified handler
      handleExistingConversationMessage({
        type: 'GIF',
        content: gif.url,
      })
    }
    setShowGifPicker(false)
    // Remove this auto-scroll - it will happen when the message is sent
    // setTimeout(scrollToBottom, 300);
  }

  // Modify the toggle for showing GIF picker to prevent scrolling
  const handleToggleGifPicker = () => {
    // Get the current scroll position
    const messagesContainer = document.querySelector('.flex-1.overflow-y-auto')
    const currentScrollTop = messagesContainer?.scrollTop || 0

    // Set the prevention flag to true BEFORE any state changes
    preventScrollRef.current = true

    // Toggle GIF picker
    setShowGifPicker(!showGifPicker)

    // Ensure scroll position is maintained
    if (messagesContainer) {
      // First set it immediately
      messagesContainer.scrollTop = currentScrollTop

      // Then use both requestAnimationFrame and setTimeout to guarantee it sticks
      requestAnimationFrame(() => {
        messagesContainer.scrollTop = currentScrollTop

        setTimeout(() => {
          if (messagesContainer.scrollTop !== currentScrollTop) {
            messagesContainer.scrollTop = currentScrollTop
          }
          // Reset prevention flag after a delay
          setTimeout(() => {
            preventScrollRef.current = false
          }, 200)
        }, 50)
      })
    } else {
      // Reset prevention flag after a delay if no container
      setTimeout(() => {
        preventScrollRef.current = false
      }, 300)
    }
  }

  // Unified message handler for existing conversations
  const handleExistingConversationMessage = async (messageData) => {
    if (!conversation?.id) return

    try {
      let fileObject = null

      // Store the actual file object for upload
      if (messageData.file) {
        fileObject = messageData.file
      }

      // For text messages, use the chat hook's built-in handler
      if (messageData.type === 'TEXT' && chatData.handleSendMessage) {
        chatData.setMessage('')
        chatData.handleSendMessage(
          null,
          messageData.type,
          messageData.content,
          messageData.replyToMessage,
        )
        // Scroll to bottom after sending a text message
        setTimeout(scrollToBottom, 200)

        // Clear the reply message
        setReplyMessage(null)
      } else {
        // For media messages or as fallback, use direct API call
        // Find the receiver ID (first member who is not the current user)
        const otherMember = conversation?.members?.find(
          (m) => m.id !== currentUser.id,
        )

        if (!otherMember) {
          console.error('Cannot find receiver for sending media')
          alert('Error: Cannot identify message recipient')
          return
        }

        // Show toast or loading indicator
        console.log(`Sending ${messageData.type} message...`)

        // Create a temporary message to show immediately
        const tempMessage = {
          id: `temp-${Date.now()}`,
          content: messageData.content || '',
          message: messageData.content || '',
          type: messageData.type,
          senderId: currentUser.id,
          sender: {
            id: currentUser.id,
            fullName: currentUser.fullName,
            avatar: currentUser.avatar,
          },
          createdAt: new Date().toISOString(),
          isLocal: true,
          isFromCurrentUser: true,
        }

        // Add reply information to the temporary message if replying
        if (messageData.replyToMessage) {
          tempMessage.replyToId = messageData.replyToMessage.id
          tempMessage.replyToMessage = messageData.replyToMessage
        }

        // Add appropriate file URL handling for different message types
        if (
          fileObject &&
          ['IMAGE', 'VIDEO', 'AUDIO', 'FILE'].includes(messageData.type)
        ) {
          // For file uploads, create a temporary object URL to display immediately
          tempMessage.file = URL.createObjectURL(fileObject)
        } else if (messageData.type === 'GIF') {
          // For GIFs, the content contains the URL, so we set file to that URL
          tempMessage.file = messageData.content
        }

        console.log('tempMessage', tempMessage)

        // Add to local messages for immediate display
        setLocalMediaMessages((prev) => [...prev, tempMessage])

        // Create FormData for the message with file
        const formData = new FormData()
        formData.append('receiverId', otherMember.id)
        formData.append('conversationId', conversation.id)
        formData.append('message', messageData.content || '')
        formData.append('type', messageData.type)

        // Append reply information if replying
        if (messageData.replyToMessage?.id) {
          formData.append('replyToId', messageData.replyToMessage.id)
        }

        // Append file if it exists
        if (fileObject && messageData.type !== 'GIF') {
          formData.append('file', fileObject)
        } else if (messageData.type === 'GIF') {
          // For GIFs, the content contains the URL
          formData.append('message', messageData.content)
        }

        // Send the message with file using axios directly
        const response = await instance.post('/messages/private', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        console.log(`${messageData.type} message sent!`, response)

        // Invalidate the messages query to fetch the updated messages
        // This will refresh the messages without a full page reload
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: ['messages', conversation.id],
          })
        }, 500)

        // Clear the reply message
        setReplyMessage(null)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    }
  }

  // Unified message handler for new conversations
  const handleNewConversationMessage = async (messageData) => {
    if (!conversation?.user?.id) {
      console.error('Missing user information for new conversation')
      return
    }

    setIsCreatingConversation(true)

    try {
      let fileObject = null

      // Store the actual file object for upload
      if (messageData.file) {
        fileObject = messageData.file
      }

      // Show toast or loading indicator for media messages
      if (messageData.type !== 'TEXT') {
        console.log(`Sending ${messageData.type} message...`)
      }

      // Create a temporary message to show immediately (for non-text messages)
      if (messageData.type !== 'TEXT') {
        const tempMessage = {
          id: `temp-${Date.now()}`,
          content: messageData.content || '',
          message: messageData.content || '',
          type: messageData.type,
          senderId: currentUser.id,
          sender: {
            id: currentUser.id,
            fullName: currentUser.fullName,
            avatar: currentUser.avatar,
          },
          createdAt: new Date().toISOString(),
          isLocal: true,
          isFromCurrentUser: true,
        }

        // Add reply information if replying
        if (messageData.replyToMessage) {
          tempMessage.replyToId = messageData.replyToMessage.id
          tempMessage.replyToMessage = messageData.replyToMessage
        }

        // Add appropriate file URL handling for different message types
        if (
          fileObject &&
          ['IMAGE', 'VIDEO', 'AUDIO', 'FILE'].includes(messageData.type)
        ) {
          // For file uploads, create a temporary object URL to display immediately
          tempMessage.file = URL.createObjectURL(fileObject)
        } else if (messageData.type === 'GIF') {
          // For GIFs, the content contains the URL, so we set file to that URL
          tempMessage.file = messageData.content
        }

        console.log('New conversation temp message:', tempMessage)
        // Add to local messages for immediate display
        setLocalMediaMessages((prev) => [...prev, tempMessage])
      }

      // Create FormData for the message with file
      const formData = new FormData()
      formData.append('receiverId', conversation.user.id)
      formData.append('message', messageData.content || '')
      formData.append('type', messageData.type)

      // Append reply information if replying
      if (messageData.replyToMessage?.id) {
        formData.append('replyToId', messageData.replyToMessage.id)
      }

      // Append file if it exists
      if (fileObject && messageData.type !== 'GIF') {
        formData.append('file', fileObject)
      } else if (messageData.type === 'GIF') {
        // For GIFs, the content contains the URL
        formData.append('message', messageData.content)
      }

      // Send the message with file using axios directly
      const response = await instance.post('/messages/private', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      console.log(`First message sent!`, response)

      // Navigate to the new conversation if successful
      if (response?.data?.data?.conversationId) {
        navigate(`/chats/${response.data.data.conversationId}`, {
          replace: true,
        })
      }

      setIsCreatingConversation(false)

      // Clear first message if it was a text message
      if (messageData.type === 'TEXT') {
        setFirstMessage('')
      }

      // Clear the reply message
      setReplyMessage(null)
    } catch (error) {
      console.error('Error sending message:', error)
      setIsCreatingConversation(false)
      alert('Failed to send message. Please try again.')
    }
  }

  // Unified message handler that routes to the appropriate handler
  const handleSendMessage = (messageData) => {
    if (isNewConversation) {
      handleNewConversationMessage(messageData)
    } else {
      handleExistingConversationMessage(messageData)
    }
  }

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    // Skip scrolling if prevented
    if (preventScrollRef.current) return

    if (isNewConversation) {
      // For new conversations, scroll the container element
      const container = document.querySelector('.flex-1.overflow-y-auto')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    } else if (chatData?.messagesEndRef?.current) {
      // For existing conversations, use the messagesEndRef
      chatData.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Auto scroll to bottom when sending messages
  useEffect(() => {
    if (localMediaMessages.length > 0 && !preventScrollRef.current) {
      // Add condition
      setTimeout(scrollToBottom, 100)
    }
  }, [localMediaMessages, chatData?.messagesEndRef])

  // Auto scroll after sending the first message
  useEffect(() => {
    if (isCreatingConversation && !preventScrollRef.current) {
      // Add condition
      setTimeout(scrollToBottom, 100)
    }
  }, [isCreatingConversation])

  // Fix GIF picker position in the first conversation view
  const fixGifPickerPosition = () => {
    if (showGifPicker) {
      return (
        <div className="absolute bottom-16 left-0 right-0 z-20">
          <GifPicker
            tenorApiKey={import.meta.env.VITE_TENOR_API_KEY}
            onGifClick={handleGifSelect}
            country="VN"
            locale="vi_VN"
            contentFilter="OFF"
          />
        </div>
      )
    }
    return null
  }

  // Function to render emoji picker with fixed position
  const renderEmojiPicker = () => {
    if (showEmojiPicker) {
      return (
        <div className="absolute bottom-16 right-0 z-20">
          <Picker
            theme="light"
            data={data}
            locale="vi"
            navPosition="bottom"
            previewPosition="none"
            skinTonePosition="none"
            onEmojiSelect={(e) => {
              // Set the emoji in the message
              setMessage((prev) => prev + e.native)
            }}
          />
        </div>
      )
    }
    return null
  }

  // Function to render emoji picker with fixed position for new conversations
  const renderNewConversationEmojiPicker = () => {
    if (showEmojiPicker) {
      return (
        <div className="absolute bottom-16 right-0 z-20">
          <Picker
            theme="light"
            data={data}
            locale="vi"
            navPosition="bottom"
            previewPosition="none"
            skinTonePosition="none"
            onEmojiSelect={(e) => {
              setFirstMessage((prev) => prev + e.native)
            }}
          />
        </div>
      )
    }
    return null
  }

  // Function to handle replying to a message
  const handleReply = (message) => {
    // Completely disable all automatic scrolling
    preventScrollRef.current = true

    // Store current scroll position
    const currentScrollTop = chatData?.messagesContainerRef?.current?.scrollTop
    const messagesContainer = chatData?.messagesContainerRef?.current

    // Set reply message without letting the component re-render trigger a scroll
    setReplyMessage(message)

    // Use requestAnimationFrame to maintain scroll position after DOM updates
    requestAnimationFrame(() => {
      if (messagesContainer && typeof currentScrollTop === 'number') {
        messagesContainer.scrollTop = currentScrollTop

        // Focus input without causing scroll
        const inputElement = document.querySelector('textarea')
        if (inputElement) {
          // Use setTimeout to ensure the focus happens after any layout changes
          setTimeout(() => {
            inputElement.focus({ preventScroll: true })

            // Double-check scroll position after focus
            if (messagesContainer.scrollTop !== currentScrollTop) {
              messagesContainer.scrollTop = currentScrollTop
            }

            // Reset the prevent scroll flag after everything is stable
            setTimeout(() => {
              preventScrollRef.current = false
            }, 500)
          }, 50)
        }
      } else {
        // Reset flag if we couldn't maintain scroll position
        setTimeout(() => {
          preventScrollRef.current = false
        }, 500)
      }
    })
  }

  // Function to cancel replying
  const handleCancelReply = () => {
    setReplyMessage(null)
  }

  // Special UI for new conversations
  if (isNewConversation) {
    const receiverInfo = conversation.user

    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex h-full flex-1 flex-col overflow-hidden bg-gray-200">
          <ChatHeader
            receiverInfo={receiverInfo}
            onAvatarClick={() => openProfileDialog(receiverInfo)}
            onMenuClick={() => {
              // Completely disable automatic scrolling
              preventScrollRef.current = true

              // Capture current scroll position
              const messagesContainer = document.querySelector(
                '.flex-1.overflow-y-auto',
              )
              const currentScrollTop = messagesContainer?.scrollTop

              // Toggle sidebar
              setIsSidebarOpen(!isSidebarOpen)

              // Use requestAnimationFrame to maintain scroll position after DOM updates
              requestAnimationFrame(() => {
                if (messagesContainer && typeof currentScrollTop === 'number') {
                  messagesContainer.scrollTop = currentScrollTop

                  // Double-check scroll position after a short delay to account for any layout shifts
                  setTimeout(() => {
                    if (messagesContainer.scrollTop !== currentScrollTop) {
                      messagesContainer.scrollTop = currentScrollTop
                    }

                    // Reset the prevent scroll flag after everything is stable
                    setTimeout(() => {
                      preventScrollRef.current = false
                    }, 300)
                  }, 50)
                } else {
                  // Reset flag if we couldn't maintain scroll position
                  setTimeout(() => {
                    preventScrollRef.current = false
                  }, 300)
                }
              })
            }}
            isSidebarOpen={isSidebarOpen}
          />

          <div className="relative flex-1 overflow-y-auto p-4">
            <div className="flex h-full flex-col items-center justify-center">
              <div
                className="mb-4 h-20 w-20 cursor-pointer overflow-hidden rounded-full"
                onClick={() => openProfileDialog(receiverInfo)}
              >
                <img
                  src={
                    receiverInfo?.avatar || 'https://via.placeholder.com/100'
                  }
                  alt={receiverInfo?.fullName || 'User'}
                  className="h-full w-full rounded-full border border-gray-300 object-cover object-center"
                />
              </div>
              <h3 className="mb-1 text-xl font-semibold">
                {receiverInfo?.fullName}
              </h3>
              <p className="mb-4 text-center text-gray-600">
                Đây là cuộc hội thoại đầu tiên với {receiverInfo?.fullName}.
                <br />
                Gửi tin nhắn để bắt đầu cuộc trò chuyện.
              </p>
            </div>
          </div>

          {/* Fixed position container for pickers */}
          <div className="relative">
            {showEmojiPicker && renderNewConversationEmojiPicker()}
            {showGifPicker && fixGifPickerPosition()}
          </div>

          <MessageInput
            message={firstMessage}
            setMessage={(newText) => {
              // Get the current scroll position
              const messagesContainer = document.querySelector(
                '.flex-1.overflow-y-auto',
              )
              const currentScrollTop = messagesContainer?.scrollTop || 0

              // Set the prevention flag to true BEFORE any state changes
              preventScrollRef.current = true

              // Update the message
              setFirstMessage(newText)

              // Ensure scroll position is maintained
              if (messagesContainer) {
                // First set it immediately
                messagesContainer.scrollTop = currentScrollTop

                // Then use both requestAnimationFrame and setTimeout to guarantee it sticks
                requestAnimationFrame(() => {
                  messagesContainer.scrollTop = currentScrollTop

                  setTimeout(() => {
                    if (messagesContainer.scrollTop !== currentScrollTop) {
                      messagesContainer.scrollTop = currentScrollTop
                    }
                    // Reset prevention flag after a delay
                    setTimeout(() => {
                      preventScrollRef.current = false
                    }, 100)
                  }, 20)
                })
              } else {
                // Reset prevention flag after a delay if no container
                setTimeout(() => {
                  preventScrollRef.current = false
                }, 150)
              }
            }}
            onSendMessage={handleSendMessage}
            disabled={isCreatingConversation}
            setShowEmojiPicker={(newState) => {
              // Get the current scroll position
              const messagesContainer = document.querySelector(
                '.flex-1.overflow-y-auto',
              )
              const currentScrollTop = messagesContainer?.scrollTop || 0

              // Set the prevention flag to true BEFORE any state changes
              preventScrollRef.current = true

              // Toggle emoji picker state
              setShowEmojiPicker(newState)

              // Ensure scroll position is maintained
              if (messagesContainer) {
                // First set it immediately
                messagesContainer.scrollTop = currentScrollTop

                // Then use both requestAnimationFrame and setTimeout to guarantee it sticks
                requestAnimationFrame(() => {
                  messagesContainer.scrollTop = currentScrollTop

                  setTimeout(() => {
                    if (messagesContainer.scrollTop !== currentScrollTop) {
                      messagesContainer.scrollTop = currentScrollTop
                    }
                    // Reset prevention flag after a delay
                    setTimeout(() => {
                      preventScrollRef.current = false
                    }, 200)
                  }, 50)
                })
              } else {
                // Reset prevention flag after a delay if no container
                setTimeout(() => {
                  preventScrollRef.current = false
                }, 300)
              }
            }}
            showEmojiPicker={showEmojiPicker}
            onToggleGifPicker={handleToggleGifPicker}
            showGifPicker={showGifPicker}
            replyMessage={replyMessage}
            onCancelReply={handleCancelReply}
          />
        </div>

        {/* Chat Sidebar */}
        {isSidebarOpen && (
          <ChatSidebar isOpen={isSidebarOpen} receiverInfo={receiverInfo} />
        )}

        {/* Profile Dialog */}
        {selectedUser && (
          <ProfileDialog
            isOpen={isProfileDialogOpen}
            close={() => setIsProfileDialogOpen(false)}
            userId={selectedUser.id}
            userData={selectedUser}
          />
        )}
      </div>
    )
  }

  // Skip rendering if no conversation is selected
  if (!conversation?.id) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="text-center">
          <h3 className="mb-2 text-lg font-medium text-gray-700">
            Select a conversation
          </h3>
          <p className="text-sm text-gray-500">
            Choose a conversation from the list to start chatting
          </p>
        </div>
      </div>
    )
  }

  const {
    message,
    setMessage,
    typingUsers,
    messagesEndRef,
    messagesContainerRef,
    handleStartCall,
    receiverInfo,
    isLoading,
    isFetchingNextPage,
    isConnected,
  } = chatData

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-gray-200">
        <ChatHeader
          receiverInfo={receiverInfo}
          onStartCall={handleStartCall}
          onAvatarClick={openProfileDialog}
          onMenuClick={() => {
            // Completely disable automatic scrolling
            preventScrollRef.current = true

            // Capture current scroll position
            const messagesContainer = document.querySelector(
              '.flex-1.overflow-y-auto',
            )
            const currentScrollTop = messagesContainer?.scrollTop

            // Toggle sidebar
            setIsSidebarOpen(!isSidebarOpen)

            // Use requestAnimationFrame to maintain scroll position after DOM updates
            requestAnimationFrame(() => {
              if (messagesContainer && typeof currentScrollTop === 'number') {
                messagesContainer.scrollTop = currentScrollTop

                // Double-check scroll position after a short delay to account for any layout shifts
                setTimeout(() => {
                  if (messagesContainer.scrollTop !== currentScrollTop) {
                    messagesContainer.scrollTop = currentScrollTop
                  }

                  // Reset the prevent scroll flag after everything is stable
                  setTimeout(() => {
                    preventScrollRef.current = false
                  }, 300)
                }, 50)
              } else {
                // Reset flag if we couldn't maintain scroll position
                setTimeout(() => {
                  preventScrollRef.current = false
                }, 300)
              }
            })
          }}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="relative flex-1 overflow-y-auto">
          <MessagesList
            messages={allMessagesWithMedia}
            typingUsers={typingUsers}
            messagesEndRef={messagesEndRef}
            messagesContainerRef={messagesContainerRef}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            onUserClick={openProfileDialog}
            onReply={handleReply}
            preventScroll={preventScrollRef.current}
          />
        </div>

        {/* Fixed position container for pickers */}
        <div className="relative">
          {showEmojiPicker && renderEmojiPicker()}
          {showGifPicker && fixGifPickerPosition()}
        </div>

        <MessageInput
          message={message || ''}
          setMessage={(newText) => {
            // Get the current scroll position
            const messagesContainer = document.querySelector(
              '.flex-1.overflow-y-auto',
            )
            const currentScrollTop = messagesContainer?.scrollTop || 0

            // Set the prevention flag to true BEFORE any state changes
            preventScrollRef.current = true

            // Update the message
            setMessage(newText)

            // Ensure scroll position is maintained
            if (messagesContainer) {
              // First set it immediately
              messagesContainer.scrollTop = currentScrollTop

              // Then use both requestAnimationFrame and setTimeout to guarantee it sticks
              requestAnimationFrame(() => {
                messagesContainer.scrollTop = currentScrollTop

                setTimeout(() => {
                  if (messagesContainer.scrollTop !== currentScrollTop) {
                    messagesContainer.scrollTop = currentScrollTop
                  }
                  // Reset prevention flag after a delay
                  setTimeout(() => {
                    preventScrollRef.current = false
                  }, 100)
                }, 20)
              })
            } else {
              // Reset prevention flag after a delay if no container
              setTimeout(() => {
                preventScrollRef.current = false
              }, 150)
            }
          }}
          onSendMessage={handleSendMessage}
          disabled={false}
          setShowEmojiPicker={(newState) => {
            // Get the current scroll position
            const messagesContainer = document.querySelector(
              '.flex-1.overflow-y-auto',
            )
            const currentScrollTop = messagesContainer?.scrollTop || 0

            // Set the prevention flag to true BEFORE any state changes
            preventScrollRef.current = true

            // Toggle emoji picker state
            setShowEmojiPicker(newState)

            // Ensure scroll position is maintained
            if (messagesContainer) {
              // First set it immediately
              messagesContainer.scrollTop = currentScrollTop

              // Then use both requestAnimationFrame and setTimeout to guarantee it sticks
              requestAnimationFrame(() => {
                messagesContainer.scrollTop = currentScrollTop

                setTimeout(() => {
                  if (messagesContainer.scrollTop !== currentScrollTop) {
                    messagesContainer.scrollTop = currentScrollTop
                  }
                  // Reset prevention flag after a delay
                  setTimeout(() => {
                    preventScrollRef.current = false
                  }, 200)
                }, 50)
              })
            } else {
              // Reset prevention flag after a delay if no container
              setTimeout(() => {
                preventScrollRef.current = false
              }, 300)
            }
          }}
          showEmojiPicker={showEmojiPicker}
          onToggleGifPicker={handleToggleGifPicker}
          showGifPicker={showGifPicker}
          replyMessage={replyMessage}
          onCancelReply={handleCancelReply}
        />

        {!isConnected && (
          <div className="bg-red-100 p-2 text-center text-xs text-red-800">
            You&apos;re currently offline. Messages will be sent when you
            reconnect.
          </div>
        )}
      </div>

      {/* Chat Sidebar */}
      {isSidebarOpen && (
        <ChatSidebar isOpen={isSidebarOpen} receiverInfo={receiverInfo} />
      )}

      {/* Profile Dialog */}
      {selectedUser && (
        <ProfileDialog
          isOpen={isProfileDialogOpen}
          close={() => setIsProfileDialogOpen(false)}
          userId={selectedUser.id}
          userData={selectedUser}
        />
      )}
    </div>
  )
}

ChatWindow.propTypes = {
  conversation: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    members: PropTypes.array,
    avatar: PropTypes.string,
    isNew: PropTypes.bool,
    user: PropTypes.object,
  }),
}

export default ChatWindow
