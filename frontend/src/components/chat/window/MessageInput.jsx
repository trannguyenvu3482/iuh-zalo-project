import PropTypes from 'prop-types'
import { useRef } from 'react'
import { FaPaperclip, FaPaperPlane, FaSmile } from 'react-icons/fa'

const MessageInput = ({ message, setMessage, sendMessage, disabled }) => {
  const inputRef = useRef(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-2">
        <button type="button" className="text-gray-500 hover:text-gray-700">
          <FaPaperclip className="h-5 w-5" />
        </button>

        <div className="relative flex-grow">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Aa"
            className="w-full resize-none rounded-2xl border border-gray-300 bg-gray-100 p-3 pr-12 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={1}
            disabled={disabled}
            style={{
              minHeight: '44px',
              maxHeight: '120px',
            }}
          />
          <button
            type="button"
            className="absolute bottom-2 right-3 text-gray-500 hover:text-gray-700"
          >
            <FaSmile className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => sendMessage(e)}
          disabled={!message.trim() || disabled}
          className={`rounded-full p-2 ${
            !message.trim() || disabled
              ? 'cursor-not-allowed bg-gray-200 text-gray-400'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <FaPaperPlane className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

MessageInput.propTypes = {
  message: PropTypes.string.isRequired,
  setMessage: PropTypes.func.isRequired,
  sendMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

MessageInput.defaultProps = {
  disabled: false,
}

export default MessageInput
