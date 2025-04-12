import { useMutation } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createConversation } from '../../../api/apiMessage'
import useChat from '../../../hooks/useChat'
import ChatHeader from './ChatHeader'
import MessageInput from './MessageInput'
import MessagesList from './MessagesList'

const ChatWindow = ({ conversation }) => {
  const navigate = useNavigate()
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)

  console.log(conversation)

  // Always call useChat to avoid conditional hooks
  const chatData = useChat(conversation, conversation?.id || '')

  // Handle new conversation case (no ID yet)
  const isNewConversation = conversation?.isNew === true

  // For new conversations, we need to create it when sending the first message
  const { mutate: createNewConversation } = useMutation({
    mutationFn: (userId) => createConversation(userId),
    onSuccess: (response) => {
      // Navigate to the new conversation
      navigate(`/chats/${response.data.id}`, { replace: true })
    },
  })

  // Special UI for new conversations
  if (isNewConversation) {
    const receiverInfo = conversation.user

    const handleSendFirstMessage = (messageText) => {
      if (!messageText.trim() || isCreatingConversation) return

      setIsCreatingConversation(true)
      createNewConversation(receiverInfo.id, {
        onSettled: () => setIsCreatingConversation(false),
      })
    }

    return (
      <div className="flex h-full flex-col overflow-hidden bg-white">
        <ChatHeader receiverInfo={receiverInfo} />

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-4 h-20 w-20 overflow-hidden rounded-full">
              <img
                src={receiverInfo.avatar || 'https://via.placeholder.com/100'}
                alt={receiverInfo.fullName || 'User'}
                className="h-full w-full object-cover"
              />
            </div>
            <h3 className="mb-1 text-xl font-semibold">
              {receiverInfo.fullName}
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              {receiverInfo.phoneNumber}
            </p>
            <p className="mb-4 text-center text-gray-600">
              This is the beginning of your conversation with{' '}
              {receiverInfo.fullName}.
              <br />
              Send a message to start chatting.
            </p>
          </div>
        </div>

        <MessageInput
          message=""
          setMessage={() => {}}
          sendMessage={handleSendFirstMessage}
          disabled={isCreatingConversation}
        />
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
  } = chatData

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <ChatHeader receiverInfo={receiverInfo} onStartCall={handleStartCall} />

      <MessagesList
        messages={allMessages}
        typingUsers={typingUsers}
        messagesEndRef={messagesEndRef}
        messagesContainerRef={messagesContainerRef}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
      />

      <MessageInput
        message={message}
        setMessage={setMessage}
        sendMessage={handleSendMessage}
        disabled={!isConnected}
      />

      {!isConnected && (
        <div className="bg-red-100 p-2 text-center text-xs text-red-800">
          You&apos;re currently offline. Messages will be sent when you
          reconnect.
        </div>
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
