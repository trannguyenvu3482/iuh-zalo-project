import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import GifPicker from 'gif-picker-react'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendPrivateMessage } from '../../../api/apiMessage'
import useChat from '../../../hooks/useChat'
import { useUser } from '../../../hooks/useUser'
import ProfileDialog from '../../Sidebar/ProfileDialog'
import ChatHeader from './ChatHeader'
import MessageInput from './MessageInput'
import MessagesList from './MessagesList'

const ChatWindow = ({ conversation }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useUser()
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [firstMessage, setFirstMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [localMediaMessages, setLocalMediaMessages] = useState([])

  // Always call useChat to avoid conditional hooks
  const chatData = useChat(conversation, conversation?.id || '')

  // Log the key values returned from useChat for debugging
  console.log('ChatWindow received from useChat:', {
    messageValue: chatData.message,
    isConnected: chatData.isConnected,
  })

  // Handle new conversation case (no ID yet)
  const isNewConversation = conversation?.isNew === true

  // Open profile dialog
  const openProfileDialog = (user) => {
    setSelectedUser(user)
    setIsProfileDialogOpen(true)
  }

  // For new conversations, we need to send the first private message
  // The backend will handle creating the conversation if needed
  const { mutate: sendFirstPrivateMessage } = useMutation({
    mutationFn: (data) =>
      sendPrivateMessage({
        receiverId: data.receiverId,
        content: data.content || '',
        type: data.type || 'TEXT',
        file: data.file || null,
      }),
    onSuccess: (response) => {
      // Navigate to the new conversation
      navigate(`/chats/${response.data.conversationId}`, { replace: true })
    },
  })

  // Upload file helper (simulated for now)
  const uploadFile = async (file) => {
    setIsUploading(true)

    try {
      // For demo purposes, we'll just simulate an upload
      // In a real app, you would use something like:
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await axios.post('/api/upload', formData);
      // return response.data.fileUrl;

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Return a mock URL - in a real app this would be the URL returned from your server
      const mockUrl = URL.createObjectURL(file)
      return mockUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  // Auto scroll when GIF picker is closed
  useEffect(() => {
    if (!showGifPicker) {
      setTimeout(scrollToBottom, 200)
    }
  }, [showGifPicker])

  // Handle GIF selection from the GIF picker
  const handleGifSelect = (gif) => {
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
    // Scroll to bottom after selecting a GIF
    setTimeout(scrollToBottom, 300)
  }

  // Unified message handler for new conversations
  const handleNewConversationMessage = async (messageData) => {
    if (isCreatingConversation || isUploading) return

    setIsCreatingConversation(true)

    try {
      let fileUrl = null

      // If message has a file, upload it first
      if (messageData.file) {
        fileUrl = await uploadFile(messageData.file)
      }

      // Show toast or loading indicator for media messages
      if (messageData.type !== 'TEXT') {
        console.log(`Sending ${messageData.type} message...`)
      }

      // Send the message
      sendFirstPrivateMessage(
        {
          receiverId: conversation.user.id,
          content: messageData.content || '',
          type: messageData.type,
          file:
            fileUrl ||
            (messageData.type === 'GIF' ? messageData.content : null),
        },
        {
          onSettled: () => setIsCreatingConversation(false),
        },
      )

      // Clear first message if it was a text message
      if (messageData.type === 'TEXT') {
        setFirstMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setIsCreatingConversation(false)
      alert('Failed to send message. Please try again.')
    }
  }

  // Unified message handler for existing conversations
  const handleExistingConversationMessage = async (messageData) => {
    if (!conversation?.id) return

    try {
      let fileUrl = null

      // If message has a file, upload it first
      if (messageData.file) {
        fileUrl = await uploadFile(messageData.file)
      }

      // For text messages, use the chat hook's built-in handler
      if (messageData.type === 'TEXT' && chatData.handleSendMessage) {
        chatData.setMessage('')
        chatData.handleSendMessage(null, messageData.type, messageData.content)
        // Scroll to bottom after sending a text message
        setTimeout(scrollToBottom, 200)
      } else {
        // For media messages or as fallback, use direct API call
        // Find the receiver ID (first member who is not the current user)
        const otherMember = conversation?.members?.find(
          (m) => m.id !== chatData.receiverInfo?.id,
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
          content: fileUrl || messageData.content,
          message: fileUrl || messageData.content,
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

        // Add to local messages for immediate display
        setLocalMediaMessages((prev) => [...prev, tempMessage])

        // Send the message using the API
        const response = await sendPrivateMessage({
          receiverId: otherMember.id,
          conversationId: conversation.id,
          content: messageData.content || '',
          type: messageData.type,
          file: fileUrl || messageData.content, // For GIFs, content contains the URL
        })

        console.log(`${messageData.type} message sent!`, response)

        // Invalidate the messages query to fetch the updated messages
        // This will refresh the messages without a full page reload
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: ['messages', conversation.id],
          })
        }, 500)
      }
    } catch (error) {
      console.error('Error sending message:', error)
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

  // Combine server messages with local media messages
  const allMessagesWithMedia = chatData.allMessages
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

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
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
    if (localMediaMessages.length > 0) {
      setTimeout(scrollToBottom, 100)
    }
  }, [localMediaMessages, chatData?.messagesEndRef])

  // Auto scroll after sending the first message
  useEffect(() => {
    if (isCreatingConversation) {
      setTimeout(scrollToBottom, 100)
    }
  }, [isCreatingConversation])

  // Fix GIF picker position in the first conversation view
  const fixGifPickerPosition = () => {
    if (showGifPicker) {
      return (
        <div className="absolute bottom-0 left-0 right-0 z-10">
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

  // Special UI for new conversations
  if (isNewConversation) {
    const receiverInfo = conversation.user

    return (
      <div className="flex h-full flex-col overflow-hidden bg-gray-200">
        <ChatHeader
          receiverInfo={receiverInfo}
          onAvatarClick={() => openProfileDialog(receiverInfo)}
        />

        <div className="relative flex-1 overflow-y-auto p-4">
          <div className="flex h-full flex-col items-center justify-center">
            <div
              className="mb-4 h-20 w-20 cursor-pointer overflow-hidden rounded-full"
              onClick={() => openProfileDialog(receiverInfo)}
            >
              <img
                src={receiverInfo?.avatar || 'https://via.placeholder.com/100'}
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
          {showEmojiPicker && (
            <Picker
              theme="light"
              data={data}
              locale="vi"
              navPosition="bottom"
              previewPosition="none"
              skinTonePosition="none"
              onEmojiSelect={(e) => {
                setFirstMessage(firstMessage + e.native)
              }}
            />
          )}
          {fixGifPickerPosition()}
        </div>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="rounded-lg bg-white p-4 shadow-lg">
              <div className="mb-2 text-center">Uploading file...</div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full animate-pulse bg-blue-500 transition-all"></div>
              </div>
            </div>
          </div>
        )}

        <MessageInput
          message={firstMessage}
          setMessage={setFirstMessage}
          onSendMessage={handleSendMessage}
          disabled={isCreatingConversation || isUploading}
          setShowEmojiPicker={setShowEmojiPicker}
          showEmojiPicker={showEmojiPicker}
          setShowGifPicker={setShowGifPicker}
          showGifPicker={showGifPicker}
        />

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
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <ChatHeader
        receiverInfo={receiverInfo}
        onStartCall={handleStartCall}
        onAvatarClick={() => openProfileDialog(receiverInfo)}
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
        />

        {showEmojiPicker && (
          <div className="absolute bottom-0 right-0 z-10">
            <Picker
              theme="light"
              data={data}
              locale="vi"
              navPosition="bottom"
              previewPosition="none"
              skinTonePosition="none"
              onEmojiSelect={(e) => {
                setMessage((prev) => prev + e.native)
              }}
            />
          </div>
        )}
        {fixGifPickerPosition()}
      </div>

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="rounded-lg bg-white p-4 shadow-lg">
            <div className="mb-2 text-center">Uploading file...</div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full animate-pulse bg-blue-500 transition-all"></div>
            </div>
          </div>
        </div>
      )}

      <MessageInput
        message={message || ''}
        setMessage={setMessage}
        onSendMessage={handleSendMessage}
        disabled={isUploading}
        setShowEmojiPicker={setShowEmojiPicker}
        showEmojiPicker={showEmojiPicker}
        setShowGifPicker={setShowGifPicker}
        showGifPicker={showGifPicker}
      />

      {!isConnected && (
        <div className="bg-red-100 p-2 text-center text-xs text-red-800">
          You&apos;re currently offline. Messages will be sent when you
          reconnect.
        </div>
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
