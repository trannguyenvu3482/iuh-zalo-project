import PropTypes from 'prop-types'
import { useEffect, useRef } from 'react'
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
  onUserClick,
  onReply,
  preventScroll,
}) => {
  const { user } = useUserStore()
  const prevMessagesLengthRef = useRef(0)

  // Scroll to bottom when new messages are loaded
  useEffect(() => {
    if (
      !isLoading &&
      messages.length > 0 &&
      messagesEndRef.current &&
      !preventScroll
    ) {
      // Only auto-scroll when:
      // 1. New messages arrive (length increased)
      // 2. We're already near the bottom
      // 3. The initial load completes
      // 4. preventScroll is NOT true

      const shouldScrollToBottom =
        messages.length > prevMessagesLengthRef.current ||
        (messagesContainerRef.current &&
          isNearBottom(messagesContainerRef.current)) ||
        prevMessagesLengthRef.current === 0

      if (shouldScrollToBottom) {
        setTimeout(() => {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }

      prevMessagesLengthRef.current = messages.length
    }
  }, [messages, isLoading, messagesEndRef, preventScroll])

  // Check if user is already near the bottom of the scroll
  const isNearBottom = (container) => {
    const threshold = 200 // pixels
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    )
  }

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
            message.senderId === user?.id ||
            message.sender?.id === user?.id ||
            (typeof message.sender === 'string' &&
              message.sender === user?.id) ||
            message.isFromCurrentUser === true
          }
          onUserClick={onUserClick}
          onReply={onReply}
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
  onUserClick: PropTypes.func,
  onReply: PropTypes.func,
  preventScroll: PropTypes.bool,
}

MessagesList.defaultProps = {
  typingUsers: [],
  isLoading: false,
  isFetchingNextPage: false,
  onUserClick: () => {},
  onReply: () => {},
  preventScroll: false,
}

export default MessagesList
