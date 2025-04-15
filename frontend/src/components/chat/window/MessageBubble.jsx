import { format } from 'date-fns'
import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { AiOutlineEye } from 'react-icons/ai'
import { BiCopy, BiShareAlt, BiTrash } from 'react-icons/bi'
import { FaStar } from 'react-icons/fa'
import { FiAlertCircle, FiFile } from 'react-icons/fi'
import { HiOutlineReply } from 'react-icons/hi'
import { HiMiniGif } from 'react-icons/hi2'
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
  // For context menu
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Handle different message formats
  const content = message.content || message.message || ''
  const timestamp =
    message.createdAt ||
    message.timestamp ||
    message.created_at ||
    new Date().toISOString()
  const isRecalled = message.isRecalled || false
  const messageType = message.type || (isImageUrl(content) ? 'IMAGE' : 'TEXT')

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

  // Handle right click for context menu
  const handleContextMenu = (e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenuPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsMenuOpen(true)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // Menu items for the context menu
  const menuItems = [
    {
      icon: <HiOutlineReply />,
      text: 'Trả lời',
      action: () => console.log('Reply to:', message.id),
    },
    {
      icon: <BiShareAlt />,
      text: 'Chia sẻ',
      action: () => console.log('Share message:', message.id),
    },
    {
      icon: <BiCopy />,
      text: 'Copy tin nhắn',
      action: () => {
        navigator.clipboard.writeText(content)
        console.log('Copied message:', message.id)
      },
    },
    {
      icon: <FaStar />,
      text: 'Đánh dấu tin nhắn',
      action: () => console.log('Marked message:', message.id),
    },
    {
      icon: <AiOutlineEye />,
      text: 'Xem chi tiết',
      action: () => console.log('View details:', message.id),
    },
  ]

  // Additional options for user's own messages
  const ownMessageOptions = [
    {
      icon: <BiTrash className="text-red-500" />,
      text: 'Thu hồi',
      action: () => console.log('Recalled message:', message.id),
    },
    {
      icon: <BiTrash className="text-red-500" />,
      text: 'Xóa chỉ ở phía tôi',
      action: () => console.log('Delete just for me:', message.id),
    },
  ]

  // Render message content based on type
  const renderMessageContent = () => {
    if (isRecalled) {
      return (
        <div className="flex items-center gap-1 text-sm italic">
          <FiAlertCircle className="h-4 w-4" />
          <span>Tin nhắn đã bị thu hồi</span>
        </div>
      )
    }

    switch (messageType) {
      case 'IMAGE':
        return <ChatImageViewer imageUrl={content} sender={sender} />

      case 'GIF':
        return (
          <div className="relative">
            <ChatImageViewer imageUrl={content} sender={sender} />
            <div className="absolute left-1 top-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
              <HiMiniGif className="h-4 w-4" />
            </div>
          </div>
        )

      case 'VIDEO':
        return (
          <div className="w-full max-w-[240px]">
            <video
              controls
              className="rounded-md"
              src={content || message.file}
              style={{ maxWidth: '100%' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )

      case 'AUDIO':
        return (
          <div className="w-full max-w-[240px]">
            <audio controls className="w-full" src={content || message.file}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )

      case 'FILE':
        return (
          <div className="flex items-center gap-2 rounded-md bg-white/50 p-2">
            <FiFile className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-sm font-medium">
                {content.split('/').pop() || 'File'}
              </p>
              <a
                href={content || message.file}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 underline"
              >
                Tải xuống
              </a>
            </div>
          </div>
        )

      case 'SYSTEM':
        return (
          <div className="flex items-center justify-center gap-1 text-sm italic">
            <FiAlertCircle className="h-4 w-4" />
            <span>{content}</span>
          </div>
        )

      default:
        return <p className="break-words text-sm">{content}</p>
    }
  }

  // For system messages, render differently
  if (messageType === 'SYSTEM' || message.isSystemMessage) {
    return (
      <div className="my-2 flex justify-center">
        <div className="rounded-full bg-gray-100 px-4 py-1 text-center text-xs text-gray-500">
          {content}
        </div>
      </div>
    )
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
        className={`relative max-w-[75%] rounded-lg px-4 py-2 ${
          isCurrentUser
            ? isRecalled
              ? 'bg-gray-100 text-gray-500'
              : 'bg-blue-500 text-white'
            : isRecalled
              ? 'bg-gray-100 text-gray-500'
              : 'bg-gray-200 text-gray-900'
        }`}
        onContextMenu={handleContextMenu}
      >
        {!isCurrentUser && (
          <p className="mb-1 text-xs font-semibold text-gray-700">
            {senderName}
          </p>
        )}

        {/* Message content based on type */}
        {renderMessageContent()}

        <p
          className={`mt-1 text-right text-xs ${
            isCurrentUser
              ? isRecalled
                ? 'text-gray-400'
                : 'text-blue-100'
              : 'text-gray-500'
          }`}
        >
          {messageTime}
        </p>

        {/* Context Menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
            style={{
              top: `${contextMenuPosition.y}px`,
              [isCurrentUser ? 'right' : 'left']: '0px',
              minWidth: '220px',
            }}
          >
            <div className="py-1">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    item.action()
                    setIsMenuOpen(false)
                  }}
                >
                  <span className="mr-2 text-gray-500">{item.icon}</span>
                  {item.text}
                </button>
              ))}

              {isCurrentUser && (
                <>
                  <div className="my-1 border-t border-gray-200"></div>
                  {ownMessageOptions.map((item, index) => (
                    <button
                      key={`own-${index}`}
                      className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        item.action()
                        setIsMenuOpen(false)
                      }}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.text}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
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
    isRecalled: PropTypes.bool,
    type: PropTypes.string,
    isSystemMessage: PropTypes.bool,
    file: PropTypes.string,
  }).isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  onUserClick: PropTypes.func,
}

MessageBubble.defaultProps = {
  onUserClick: () => {},
}

export default MessageBubble
