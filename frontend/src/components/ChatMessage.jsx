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

const ChatMessage = ({ message }) => {
  const { user } = useUserStore()

  // Handle sender as either object or string
  const senderId = message.senderId || (message.sender && message.sender.id)

  // Determine if the message is from the current user
  const isCurrentUser =
    senderId === user?.id || message.isFromCurrentUser === true

  // Extract message content
  const content = message.content || message.message || ''

  // Check if the message contains an image
  const isImage = isImageUrl(content)

  // Prepare sender info for image viewer
  const senderInfo = {
    id: senderId,
    fullName:
      message.sender?.fullName ||
      message.sender?.name ||
      message.senderName ||
      'User',
    avatar: message.sender?.avatar || message.senderAvatar,
  }

  console.log('Message display:', {
    text: content,
    isCurrentUser,
    senderId,
    sender: message.sender,
    isFromCurrentUser: message.isFromCurrentUser,
    userId: user?.id,
  })

  return (
    <div
      className={`mx-2 my-1 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isCurrentUser && (
        <div className="mr-2 h-8 w-8 flex-shrink-0">
          <img
            src={senderInfo.avatar || 'https://via.placeholder.com/40'}
            alt={senderInfo.fullName}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-lg p-2 ${
          isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
        }`}
      >
        {!isCurrentUser && (
          <p className="text-xs font-semibold">{senderInfo.fullName}</p>
        )}

        {isImage ? (
          <ChatImageViewer imageUrl={content} sender={senderInfo} />
        ) : (
          <p className="break-words text-sm">{content}</p>
        )}

        <p
          className={`text-right text-xs ${
            isCurrentUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {message.timestamp
            ? format(new Date(message.timestamp), 'h:mm a')
            : message.created_at
              ? format(new Date(message.created_at), 'h:mm a')
              : ''}
        </p>
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
    sender: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        fullName: PropTypes.string,
        name: PropTypes.string,
        avatar: PropTypes.string,
      }),
    ]),
    senderName: PropTypes.string,
    senderAvatar: PropTypes.string,
    timestamp: PropTypes.string,
    created_at: PropTypes.string,
    readBy: PropTypes.arrayOf(PropTypes.string),
    isFromCurrentUser: PropTypes.bool,
  }).isRequired,
}

export default ChatMessage
