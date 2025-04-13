import { format } from 'date-fns'
import PropTypes from 'prop-types'
import { useUserStore } from '../zustand/userStore'
import ChatImageViewer from './chat/ChatImageViewer'

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

const ChatMessage = ({ message, isLastMessage }) => {
  const { user } = useUserStore()

  // Determine if the message is from the current user
  const isCurrentUser =
    message.senderId === user?.id ||
    message.sender === user?.id ||
    message.isFromCurrentUser === true

  // Extract message content
  const content = message.content || message.message || ''

  // Check if the message contains an image
  const isImage = isImageUrl(content)

  // Prepare sender info for image viewer
  const senderInfo = {
    id: message.senderId || message.sender,
    fullName: message.senderName || 'User',
    avatar: message.senderAvatar,
  }

  console.log('Message display:', {
    text: content,
    isCurrentUser,
    senderId: message.senderId,
    sender: message.sender,
    isFromCurrentUser: message.isFromCurrentUser,
    userId: user?.id,
  })

  return (
    <div
      className={`mb-8 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      ref={
        isLastMessage
          ? (ref) => ref?.scrollIntoView({ behavior: 'smooth' })
          : null
      }
    >
      {/* Avatar for other user's messages */}
      {!isCurrentUser && (
        <div className="mr-2 h-8 w-8 flex-shrink-0">
          <img
            src={
              message.senderAvatar || 'https://avatar.iran.liara.run/public/44'
            }
            alt={message.senderName}
            className="h-8 w-8 rounded-full object-cover"
          />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`relative max-w-[70%] rounded-lg px-3 py-2 ${
          isCurrentUser
            ? 'rounded-br-none bg-primary-blue text-white'
            : 'rounded-bl-none bg-white text-gray-800 shadow-sm'
        }`}
      >
        {/* Sender name for group chats */}
        {!isCurrentUser && message.senderName && (
          <div className="mb-1 text-xs font-medium text-gray-600">
            {message.senderName}
          </div>
        )}

        {/* Message content - Text or Image */}
        {isImage ? (
          <ChatImageViewer imageUrl={content} sender={senderInfo} />
        ) : (
          <div className="text-sm">{content}</div>
        )}

        {/* Timestamp */}
        <div
          className={`mt-1 text-right text-xs ${
            isCurrentUser ? 'text-gray-200' : 'text-gray-400'
          }`}
        >
          {message.timestamp
            ? format(new Date(message.timestamp), 'HH:mm')
            : format(new Date(), 'HH:mm')}
        </div>

        {/* Message status (for current user's messages) */}
        {isCurrentUser && (
          <div className="absolute -bottom-4 right-0 text-xs text-gray-500">
            {message.readBy?.length > 0 ? 'Đã xem' : 'Đã gửi'}
          </div>
        )}
      </div>
    </div>
  )
}

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    content: PropTypes.string,
    message: PropTypes.string,
    senderId: PropTypes.string,
    sender: PropTypes.string,
    senderName: PropTypes.string,
    senderAvatar: PropTypes.string,
    timestamp: PropTypes.string,
    readBy: PropTypes.arrayOf(PropTypes.string),
    isFromCurrentUser: PropTypes.bool,
  }).isRequired,
  isLastMessage: PropTypes.bool,
}

ChatMessage.defaultProps = {
  isLastMessage: false,
}

export default ChatMessage
