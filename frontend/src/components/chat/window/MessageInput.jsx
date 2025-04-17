import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { BsImage, BsMic } from 'react-icons/bs'
import { FaPaperclip, FaPaperPlane, FaSmile, FaThumbsUp } from 'react-icons/fa'
import { FiX } from 'react-icons/fi'
import { HiGif } from 'react-icons/hi2'

const MAX_CHARS = 2000

// Reply bar component to display the message being replied to
const ReplyBar = ({ replyMessage, onCancelReply }) => {
  // Handle different message formats
  const content = replyMessage.content || replyMessage.message || ''
  const senderName =
    replyMessage.sender?.fullName || replyMessage.sender?.name || 'User'

  // Determine message type for display purposes
  const messageType = replyMessage.type || 'TEXT'

  // Create a preview of the message content
  const getPreviewText = () => {
    if (messageType === 'TEXT') {
      return content.length > 50 ? content.substring(0, 50) + '...' : content
    } else if (messageType === 'IMAGE') {
      return '[Hình ảnh]'
    } else if (messageType === 'GIF') {
      return '[GIF]'
    } else if (messageType === 'VIDEO') {
      return '[Video]'
    } else if (messageType === 'AUDIO') {
      return '[Âm thanh]'
    } else if (messageType === 'FILE') {
      return '[Tệp]'
    }
    return '[Tin nhắn]'
  }

  return (
    <div className="border-t border-gray-300 bg-gray-100 px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xs font-medium text-blue-600">
            Trả lời {senderName}
          </div>
          <div className="mt-1 line-clamp-1 text-sm text-gray-600">
            {getPreviewText()}
          </div>
        </div>
        <button
          onClick={onCancelReply}
          className="ml-2 rounded-full p-1 hover:bg-gray-200"
        >
          <FiX className="h-5 w-5 text-gray-500" />
        </button>
      </div>
    </div>
  )
}

ReplyBar.propTypes = {
  replyMessage: PropTypes.object.isRequired,
  onCancelReply: PropTypes.func.isRequired,
}

const MessageInput = ({
  message,
  setMessage,
  onSendMessage,
  disabled,
  setShowEmojiPicker,
  showEmojiPicker,
  setShowGifPicker,
  showGifPicker,
  onToggleGifPicker,
  replyMessage,
  onCancelReply,
}) => {
  const inputRef = useRef(null)
  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const [charCount, setCharCount] = useState(0)

  // Update character count when message changes
  useEffect(() => {
    setCharCount(message?.length || 0)
  }, [message])

  // Handle text message submission
  const handleSendMessage = (e) => {
    e?.preventDefault()
    if (!message?.trim() && !replyMessage) return
    if (disabled || charCount > MAX_CHARS) return

    // Send as text message with reply information if applicable
    onSendMessage({
      type: 'TEXT',
      content: message,
      replyToId: replyMessage?.id,
      replyToMessage: replyMessage,
    })

    // Clear the input
    setMessage('')

    // Clear reply state if any
    if (replyMessage && onCancelReply) {
      onCancelReply()
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  // Handle the thumbs up / text send button
  const handleSendButton = (e) => {
    if (!message?.trim() && !replyMessage) {
      // Send a thumbs up if no text
      onSendMessage({
        type: 'TEXT',
        content: '👍',
      })
    } else {
      // Send the typed message
      handleSendMessage(e)
    }
  }

  // Handle message input change
  const handleMessageChange = (e) => {
    // Simply update the message text without scroll manipulation
    const newValue = e.target.value
    setMessage(newValue)
  }

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file || disabled) return

    // Check if file is an image
    if (file.type.startsWith('image/')) {
      onSendMessage({
        type: 'IMAGE',
        file: file,
        replyToId: replyMessage?.id,
        replyToMessage: replyMessage,
      })

      // Clear reply state if any
      if (replyMessage && onCancelReply) {
        onCancelReply()
      }
    } else {
      alert('Please select a valid image file')
    }

    // Reset the input to allow selecting the same file again
    e.target.value = ''
  }

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file || disabled) return

    const fileType = file.type.startsWith('audio/')
      ? 'AUDIO'
      : file.type.startsWith('video/')
        ? 'VIDEO'
        : 'FILE'

    onSendMessage({
      type: fileType,
      file: file,
      replyToId: replyMessage?.id,
      replyToMessage: replyMessage,
    })

    // Clear reply state if any
    if (replyMessage && onCancelReply) {
      onCancelReply()
    }

    // Reset the input to allow selecting the same file again
    e.target.value = ''
  }

  // Handle GIF button
  const handleGifButton = () => {
    if (onToggleGifPicker) {
      onToggleGifPicker()
    } else {
      setShowGifPicker(!showGifPicker)
    }
  }

  // Derive limits and indicators for character count
  const isNearLimit = charCount > MAX_CHARS * 0.85
  const isOverLimit = charCount > MAX_CHARS

  return (
    <div className="relative flex flex-col bg-white">
      {/* Hidden inputs for file selection */}
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        className="hidden"
        onChange={handleImageChange}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Reply bar - shown when replying to a message */}
      {replyMessage && (
        <ReplyBar replyMessage={replyMessage} onCancelReply={onCancelReply} />
      )}

      {/* Top bar with action buttons */}
      <div className="flex items-center justify-start border-b border-gray-300 px-2 py-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-200"
            disabled={disabled}
            onClick={handleGifButton}
          >
            <HiGif className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-200"
            disabled={disabled}
            onClick={() => imageInputRef.current?.click()}
          >
            <BsImage className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-200"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <FaPaperclip className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-200"
            disabled={disabled}
          >
            <BsMic className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Bottom bar with input and send/like button */}
      <div className="relative">
        <div className="relative h-fit max-h-[48px] w-full">
          <textarea
            ref={inputRef}
            value={message || ''}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={
              replyMessage
                ? `Trả lời ${replyMessage.sender?.fullName || 'User'}...`
                : 'Nhập @, tin nhắn tới Nhóm 15 - Công Nghệ Mới - Zalo'
            }
            className={`h-full w-full py-3.5 pl-4 pr-28 text-sm outline-none transition-colors ${
              isOverLimit
                ? 'border-2 border-red-500'
                : isNearLimit
                  ? 'border border-yellow-500'
                  : ''
            }`}
            rows={1}
            disabled={disabled}
            maxLength={MAX_CHARS + 50} // Allow some buffer but still have a hard limit
          />

          {/* Action buttons positioned on the right side of input */}
          <div className="absolute right-3 top-1 flex items-center gap-2">
            {/* Character counter */}
            <div
              className={`text-xs font-medium ${
                isOverLimit
                  ? 'text-red-500'
                  : isNearLimit
                    ? 'text-yellow-600'
                    : 'text-gray-500'
              }`}
            >
              {charCount}/{MAX_CHARS}
            </div>

            <button
              type="button"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
            >
              <FaSmile className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleSendButton}
              disabled={disabled || isOverLimit}
              className={`rounded-full p-2 ${
                disabled || isOverLimit
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : message?.trim() || replyMessage
                    ? 'text-primary-blue'
                    : 'text-yellow-600'
              }`}
            >
              {message?.trim() || replyMessage ? (
                <FaPaperPlane className="h-5 w-5" />
              ) : (
                <FaThumbsUp className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

MessageInput.propTypes = {
  message: PropTypes.string,
  setMessage: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  setShowEmojiPicker: PropTypes.func,
  showEmojiPicker: PropTypes.bool,
  setShowGifPicker: PropTypes.func,
  showGifPicker: PropTypes.bool,
  onToggleGifPicker: PropTypes.func,
  replyMessage: PropTypes.object,
  onCancelReply: PropTypes.func,
}

MessageInput.defaultProps = {
  message: '',
  disabled: false,
  showEmojiPicker: false,
  showGifPicker: false,
  setShowEmojiPicker: () => {},
  setShowGifPicker: () => {},
  onToggleGifPicker: null,
  replyMessage: null,
  onCancelReply: () => {},
}

export default MessageInput
