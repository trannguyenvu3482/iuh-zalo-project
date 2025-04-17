import { format } from 'date-fns'
import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { AiOutlineEye } from 'react-icons/ai'
import { BiCopy, BiShareAlt, BiTrash } from 'react-icons/bi'
import { FaEllipsisH, FaStar } from 'react-icons/fa'
import { FiAlertCircle } from 'react-icons/fi'
import { HiOutlineReply } from 'react-icons/hi'
import { HiMiniGif } from 'react-icons/hi2'
import { recallMessage } from '../../../api/apiMessage'
import ChatImageViewer from '../../chat/ChatImageViewer'
import DocumentPreview from '../../chat/DocumentPreview'

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

// Get file name from URL
const getFilenameFromUrl = (url) => {
  if (!url || typeof url !== 'string') return 'File'
  return url.split('/').pop().split('#')[0].split('?')[0]
}

const MessageBubble = ({ message, isCurrentUser, onUserClick, onReply }) => {
  // For context menu
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const menuRef = useRef(null)
  const bubbleRef = useRef(null)

  // Handle different message formats
  const content = message.content || message.message || ''
  const fileUrl = message.file || ''
  const timestamp =
    message.createdAt ||
    message.timestamp ||
    message.created_at ||
    new Date().toISOString()
  const isRecalled = message.isRecalled || false

  // Determine message type - prioritize the explicitly set type, then detect based on content/file
  let messageType = message.type || 'TEXT'
  if (!message.type) {
    if (isImageUrl(fileUrl)) {
      messageType = fileUrl.toLowerCase().endsWith('.gif') ? 'GIF' : 'IMAGE'
    }
  } else if (fileUrl.toLowerCase().endsWith('.docx')) {
    messageType = 'DOCX'
  } else if (fileUrl.toLowerCase().endsWith('.xlsx')) {
    messageType = 'XLSX'
  } else if (fileUrl.toLowerCase().endsWith('.pptx')) {
    messageType = 'PPTX'
  } else if (fileUrl.toLowerCase().endsWith('.doc')) {
    messageType = 'DOC'
  } else if (fileUrl.toLowerCase().endsWith('.ppt')) {
    messageType = 'PPT'
  } else if (fileUrl.toLowerCase().endsWith('.xls')) {
    messageType = 'XLS'
  } else if (fileUrl.toLowerCase().endsWith('.txt')) {
    messageType = 'TXT'
  } else if (fileUrl.toLowerCase().endsWith('.csv')) {
    messageType = 'CSV'
  } else if (fileUrl.toLowerCase().endsWith('.odt')) {
    messageType = 'ODT'
  } else if (
    fileUrl.toLowerCase().endsWith('.html') ||
    fileUrl.toLowerCase().endsWith('.htm')
  ) {
    messageType = 'HTML'
  } else if (fileUrl.toLowerCase().endsWith('.tiff')) {
    messageType = 'TIFF'
  } else if (fileUrl.toLowerCase().endsWith('.bmp')) {
    messageType = 'BMP'
  } else if (fileUrl.toLowerCase().endsWith('.mp4')) {
    messageType = 'MP4'
  } else if (fileUrl.toLowerCase().endsWith('.pdf')) {
    messageType = 'PDF'
  }

  // Get sender information
  const sender = message.sender || {}
  const senderName = sender.fullName || sender.name || 'User 2'
  const senderAvatar = sender.avatar || 'https://via.placeholder.com/40'

  // Format the time
  const messageTime = timestamp ? format(new Date(timestamp), 'HH:mm') : ''

  // Handle avatar click
  const handleAvatarClick = () => {
    if (!isCurrentUser && onUserClick && sender) {
      onUserClick(sender)
    }
  }

  // Add useEffect to adjust menu position after it renders
  useEffect(() => {
    if (isMenuOpen && menuRef.current) {
      // Get the actual menu dimensions
      const menuRect = menuRef.current.getBoundingClientRect()

      // Get viewport dimensions
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Calculate new position
      let newX = contextMenuPosition.x
      let newY = contextMenuPosition.y

      // Check right edge
      if (newX + menuRect.width > viewportWidth) {
        newX = viewportWidth - menuRect.width - 10 // 10px margin
      }

      // Check bottom edge
      if (newY + menuRect.height > viewportHeight) {
        newY = viewportHeight - menuRect.height - 10 // 10px margin
      }

      // Apply new position directly to the element
      menuRef.current.style.left = `${newX}px`
      menuRef.current.style.top = `${newY}px`
    }
  }, [isMenuOpen, contextMenuPosition])

  // Handle right click for context menu
  const handleContextMenu = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Use requestAnimationFrame to prevent layout shifts
    const x = e?.clientX || 0
    const y = e?.clientY || 0

    // Set context menu position
    setContextMenuPosition({ x, y })
    setIsMenuOpen(true)

    // Prevent any scrolling
    return false
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

  // Handle reply
  const handleReply = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    console.log('Reply to:', message.id)
    onReply(message)
    setIsMenuOpen(false)
  }

  // Handle share
  const handleShare = () => {
    console.log('Share message:', message.id)
    setIsMenuOpen(false)
  }

  // Handle copy message
  const handleCopy = () => {
    const textToCopy = messageType === 'TEXT' ? content : fileUrl || content
    navigator.clipboard.writeText(textToCopy)
    console.log('Copied message:', message.id)
    setIsMenuOpen(false)
  }

  // Handle mark message
  const handleMarkMessage = () => {
    console.log('Marked message:', message.id)
    setIsMenuOpen(false)
  }

  // Handle view details
  const handleViewDetails = () => {
    console.log('View details:', message.id)
    setIsMenuOpen(false)
  }

  // Handle recall message
  const handleRecallMessage = async () => {
    try {
      console.log('Recalling message with ID:', message.id)
      await recallMessage(message.id) // Call the API
      console.log('Recalled message:', message.id)
      setIsMenuOpen(false)
    } catch (error) {
      console.error('Failed to recall message:', error)
    }
  }

  // Handle delete message
  const handleDeleteMessage = () => {
    console.log('Delete just for me:', message.id)
    setIsMenuOpen(false)
  }

  // Handle reply information
  const isReplyMessage = message.replyToId || message.replyToMessage
  const replyToMessage = message.replyToMessage || {}

  // Render message content based on type
  const renderMessageContent = () => {
    if (message.isRecalled) {
      return (
        <div className="flex items-center gap-1 text-sm italic">
          <FiAlertCircle className="h-4 w-4" />
          <span>Tin nhắn đã bị thu hồi</span>
        </div>
      )
    }

    // Get filename for document types
    const fileName = getFilenameFromUrl(fileUrl || content)

    switch (messageType) {
      case 'IMAGE':
        return <ChatImageViewer imageUrl={fileUrl || content} sender={sender} />

      case 'GIF':
        return (
          <div className="relative w-auto">
            <ChatImageViewer imageUrl={fileUrl || content} sender={sender} />
            <div className="absolute left-1 top-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
              <HiMiniGif className="h-4 w-4" />
            </div>
          </div>
        )

      // Document types
      case 'PDF':
      case 'DOCX':
      case 'XLSX':
      case 'PPTX':
      case 'DOC':
      case 'PPT':
      case 'XLS':
      case 'TXT':
      case 'CSV':
      case 'ODT':
      case 'HTML':
      case 'TIFF':
        return (
          <DocumentPreview
            fileUrl={fileUrl || content}
            fileType={messageType}
            fileName={fileName}
          />
        )

      case 'BMP':
        return <ChatImageViewer imageUrl={fileUrl || content} sender={sender} />

      case 'MP4':
        return (
          <div className="h-auto w-full max-w-[360px]">
            <video
              controls
              className="w-full rounded-md"
              style={{ maxHeight: '300px' }}
            >
              <source src={fileUrl || content} type="video/mp4" />
            </video>
          </div>
        )

      default:
        return <p className="break-words text-sm">{content}</p>
    }
  }

  // Render the reply reference if this message is a reply
  const renderReplyReference = () => {
    if (!isReplyMessage) return null

    // Get the reply message information
    const replyContent = replyToMessage.content || replyToMessage.message || ''
    const replySender =
      replyToMessage.sender?.fullName || replyToMessage.sender?.name || 'User'
    const replyType = replyToMessage.type || 'TEXT'

    // Generate a preview of the content based on type
    let previewText = ''
    if (replyType === 'TEXT') {
      previewText =
        replyContent.length > 30
          ? replyContent.substring(0, 30) + '...'
          : replyContent
    } else if (replyType === 'IMAGE') {
      previewText = '[Hình ảnh]'
    } else if (replyType === 'GIF') {
      previewText = '[GIF]'
    } else if (replyType === 'VIDEO') {
      previewText = '[Video]'
    } else if (replyType === 'AUDIO') {
      previewText = '[Âm thanh]'
    } else if (
      replyType === 'FILE' ||
      [
        'PDF',
        'DOCX',
        'XLSX',
        'PPTX',
        'DOC',
        'PPT',
        'XLS',
        'TXT',
        'CSV',
        'ODT',
        'HTML',
        'TIFF',
      ].includes(replyType)
    ) {
      previewText = '[Tệp]'
    } else {
      previewText = '[Tin nhắn]'
    }

    return (
      <div className="mb-1 rounded-md bg-gray-100 p-1.5 text-xs">
        <p className="font-medium text-blue-600">{replySender}</p>
        <p className="mt-0.5 line-clamp-1 text-gray-600">{previewText}</p>
      </div>
    )
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
      className={`mb-2 flex w-full ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
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

      {/* Message container with hover detection */}
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Message bubble */}
        <div
          className={`relative ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}
          ref={bubbleRef}
        >
          <div
            className={`relative rounded-lg px-4 py-2 shadow-md ${
              isCurrentUser
                ? isRecalled
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-[#daebff] text-gray-900'
                : isRecalled
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-white text-gray-900'
            }`}
            style={{
              maxWidth: '36vw',
              width: 'fit-content',
              minWidth:
                messageType === 'TEXT'
                  ? '120px'
                  : messageType === 'GIF'
                    ? 'auto'
                    : '240px',
            }}
            onContextMenu={handleContextMenu}
          >
            {!isCurrentUser && (
              <p className="mb-1 text-xs font-semibold text-gray-700">
                {senderName}
              </p>
            )}

            {/* Show reply reference if this is a reply message */}
            {renderReplyReference()}

            {/* Message content based on type */}
            {renderMessageContent()}

            {/* Display message text as caption for media files if available */}
            {['IMAGE', 'GIF', 'VIDEO', 'AUDIO'].includes(messageType) &&
              content && (
                <p
                  className={`mt-1 text-sm ${isCurrentUser ? 'text-blue-100' : 'text-gray-700'}`}
                >
                  {content}
                </p>
              )}

            <p
              className={`mt-1 text-left text-xs ${
                isCurrentUser
                  ? isRecalled
                    ? 'text-gray-400'
                    : 'font-semibold text-gray-500'
                  : 'font-semibold text-gray-500'
              }`}
            >
              {messageTime}
            </p>

            {/* Show the liked indicator if message is liked */}
            {isLiked && (
              <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
                <div className="flex items-center justify-center rounded-full bg-white p-1 shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-blue-500"
                  >
                    <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Like button shows when hovering */}
        {isHovered && (
          <div
            className={`absolute bottom-0 z-[10] translate-y-[calc(100%-20px)] rounded-full bg-white ${isCurrentUser ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'}`}
          >
            <button
              className={`rounded-full p-1.5 shadow-md transition-colors ${isLiked ? 'text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setIsLiked(!isLiked)}
            >
              {isLiked ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"
                  />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Action buttons - shown when hovering */}
        {isHovered && (
          <div
            className={`absolute top-1/2 z-10 flex -translate-y-1/2 gap-1 ${
              isCurrentUser
                ? 'left-0 -translate-x-[calc(100%+4px)]'
                : 'right-0 translate-x-[calc(100%+4px)]'
            }`}
          >
            {/* Reply button */}
            <button
              className="rounded-full bg-white p-1.5 shadow-md hover:bg-gray-100"
              onClick={handleReply}
            >
              <HiOutlineReply className="h-4 w-4 text-gray-600" />
            </button>

            {/* Forward button */}
            <button
              className="rounded-full bg-white p-1.5 shadow-md hover:bg-gray-100"
              onClick={handleShare}
            >
              <BiShareAlt className="h-4 w-4 text-gray-600" />
            </button>

            {/* Menu button */}
            <button
              className="rounded-full bg-white p-1.5 shadow-md hover:bg-gray-100"
              onClick={handleContextMenu}
            >
              <FaEllipsisH className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          style={{
            top: `${contextMenuPosition.y}px`,
            left: `${contextMenuPosition.x}px`,
            minWidth: '220px',
          }}
        >
          <div className="py-1">
            <button
              className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleReply}
            >
              <span className="mr-2 text-gray-500">
                <HiOutlineReply />
              </span>
              Trả lời
            </button>

            <button
              className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleShare}
            >
              <span className="mr-2 text-gray-500">
                <BiShareAlt />
              </span>
              Chia sẻ
            </button>

            <button
              className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleCopy}
            >
              <span className="mr-2 text-gray-500">
                <BiCopy />
              </span>
              Copy tin nhắn
            </button>

            <button
              className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleMarkMessage}
            >
              <span className="mr-2 text-gray-500">
                <FaStar />
              </span>
              Đánh dấu tin nhắn
            </button>

            <button
              className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleViewDetails}
            >
              <span className="mr-2 text-gray-500">
                <AiOutlineEye />
              </span>
              Xem chi tiết
            </button>

            {isCurrentUser && (
              <>
                <div className="my-1 border-t border-gray-200"></div>
                <button
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleRecallMessage}
                >
                  <span className="mr-2">
                    <BiTrash className="text-red-500" />
                  </span>
                  Thu hồi
                </button>

                <button
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleDeleteMessage}
                >
                  <span className="mr-2">
                    <BiTrash className="text-red-500" />
                  </span>
                  Xóa chỉ ở phía tôi
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    content: PropTypes.string,
    message: PropTypes.string,
    file: PropTypes.string,
    sender: PropTypes.object,
    timestamp: PropTypes.string,
    createdAt: PropTypes.string,
    created_at: PropTypes.string,
    isRecalled: PropTypes.bool,
    type: PropTypes.string,
    isSystemMessage: PropTypes.bool,
    replyToId: PropTypes.string,
    replyToMessage: PropTypes.object,
  }).isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  onUserClick: PropTypes.func,
  onReply: PropTypes.func,
}

MessageBubble.defaultProps = {
  onUserClick: () => {},
  onReply: () => {},
}

export default MessageBubble
