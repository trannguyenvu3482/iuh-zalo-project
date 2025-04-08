import PropTypes from 'prop-types'
import ChatHeader from './ChatHeader'
import MessageInput from './MessageInput'
import MessagesList from './MessagesList'
import useChat from './useChat'

const ChatWindow = ({ conversation }) => {
  // Call useChat directly and handle null case in the component
  // This avoids calling hooks conditionally
  const chatData = useChat(conversation, conversation?.id || '')

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
  }),
}

export default ChatWindow
