import PropTypes from 'prop-types'
import { useUserStore } from '../../../zustand/userStore'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

const MessagesList = ({
  messages,
  typingUsers,
  messagesEndRef,
  messagesContainerRef,
  isLoading,
  isFetchingNextPage,
}) => {
  const { user } = useUserStore()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto px-4 py-4"
      style={{ scrollBehavior: 'smooth' }}
    >
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      )}

      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || message._localId || index}
          message={message}
          isCurrentUser={
            message.senderId === user?.id || message.sender === user?.id
          }
        />
      ))}

      <TypingIndicator typingUsers={typingUsers} />

      {/* Empty div for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </div>
  )
}

MessagesList.propTypes = {
  messages: PropTypes.array.isRequired,
  typingUsers: PropTypes.array,
  messagesEndRef: PropTypes.object.isRequired,
  messagesContainerRef: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
  isFetchingNextPage: PropTypes.bool,
}

MessagesList.defaultProps = {
  typingUsers: [],
  isLoading: false,
  isFetchingNextPage: false,
}

export default MessagesList
