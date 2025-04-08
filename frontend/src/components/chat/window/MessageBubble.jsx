import { format } from 'date-fns'
import PropTypes from 'prop-types'

const MessageBubble = ({ message, isCurrentUser }) => {
  // Handle different message formats
  const content = message.content || message.message || ''
  const timestamp =
    message.createdAt ||
    message.timestamp ||
    message.created_at ||
    new Date().toISOString()

  // Format the time
  const messageTime = timestamp ? format(new Date(timestamp), 'h:mm a') : ''

  return (
    <div
      className={`mb-2 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2 ${
          isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
        }`}
      >
        <p className="break-words text-sm">{content}</p>
        <p
          className={`mt-1 text-right text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}
        >
          {messageTime}
        </p>
      </div>
    </div>
  )
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    content: PropTypes.string,
    message: PropTypes.string,
    createdAt: PropTypes.string,
    timestamp: PropTypes.string,
    created_at: PropTypes.string,
  }).isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
}

export default MessageBubble
