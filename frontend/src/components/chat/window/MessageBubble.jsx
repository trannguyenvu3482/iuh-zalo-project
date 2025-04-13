import { format } from 'date-fns'
import PropTypes from 'prop-types'
import ChatImageViewer from '../../chat/ChatImageViewer'

// Helper function to check if a string is an image URL
const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false

  // Check if URL ends with common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
  return (
    imageExtensions.some((ext) => url.toLowerCase().endsWith(ext)) ||
    url.includes('/images/') ||
    url.includes('image/')
  )
}

const MessageBubble = ({ message, isCurrentUser, onUserClick }) => {
  // Handle different message formats
  const content = message.content || message.message || ''
  const timestamp =
    message.createdAt ||
    message.timestamp ||
    message.created_at ||
    new Date().toISOString()

  // Check if the message contains an image
  const isImage = isImageUrl(content)

  // Get sender information
  const sender = message.sender || {}
  const senderName = sender.fullName || sender.name || 'User'
  const senderAvatar = sender.avatar || 'https://via.placeholder.com/40'

  // Format the time
  const messageTime = timestamp ? format(new Date(timestamp), 'h:mm a') : ''

  // Handle avatar click
  const handleAvatarClick = () => {
    if (!isCurrentUser && onUserClick && sender) {
      onUserClick(sender)
    }
  }

  return (
    <div
      className={`mb-2 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isCurrentUser && (
        <div
          className="mr-2 h-8 w-8 flex-shrink-0 cursor-pointer"
          onClick={handleAvatarClick}
        >
          <img
            src={senderAvatar}
            alt={senderName}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2 ${
          isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
        }`}
      >
        {!isCurrentUser && (
          <p className="mb-1 text-xs font-semibold text-gray-700">
            {senderName}
          </p>
        )}

        {/* Message content - Text or Image */}
        {isImage ? (
          <ChatImageViewer imageUrl={content} sender={sender} />
        ) : (
          <p className="break-words text-sm">{content}</p>
        )}

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
    id: PropTypes.string,
    content: PropTypes.string,
    message: PropTypes.string,
    sender: PropTypes.object,
    timestamp: PropTypes.string,
    createdAt: PropTypes.string,
    created_at: PropTypes.string,
  }).isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  onUserClick: PropTypes.func,
}

MessageBubble.defaultProps = {
  onUserClick: () => {},
}

export default MessageBubble
