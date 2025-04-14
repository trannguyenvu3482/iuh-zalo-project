import PropTypes from 'prop-types'
import { useEffect } from 'react'
import { FaCommentDots } from 'react-icons/fa'

/**
 * Component that displays friendship and messaging actions
 */
const ProfileActions = ({
  isCurrentUser,
  friendshipStatus,
  onFriendRequest,
  onStartChat,
  isLoading,
  userId,
}) => {
  // Use localStorage as fallback for friendship status
  useEffect(() => {
    if (!isCurrentUser && userId) {
      try {
        // Check localStorage for stored friendship status
        const storageKey = `friendship_status_${userId}`
        const storedData = localStorage.getItem(storageKey)

        if (storedData) {
          const parsedData = JSON.parse(storedData)
          // If stored status is REQUEST_SENT but current state doesn't reflect it,
          // update the display state
          if (
            parsedData.status === 'REQUEST_SENT' &&
            !friendshipStatus.hasSentRequest
          ) {
            friendshipStatus.hasSentRequest = true
          }
        }
      } catch (e) {
        console.error('Error reading friendship status from localStorage:', e)
      }
    }
  }, [friendshipStatus, isCurrentUser, userId])

  if (isCurrentUser) return null

  const getButtonLabel = () => {
    if (isLoading) {
      return 'Đang xử lý...'
    } else if (friendshipStatus.isFriend) {
      return 'Huỷ kết bạn'
    } else if (friendshipStatus.hasSentRequest) {
      return 'Huỷ lời mời'
    } else if (friendshipStatus.hasReceivedRequest) {
      return 'Chấp nhận'
    } else {
      return 'Kết bạn'
    }
  }

  const getButtonStyles = () => {
    if (isLoading) {
      return 'cursor-wait bg-gray-300 text-gray-500'
    } else if (friendshipStatus.isFriend || friendshipStatus.hasSentRequest) {
      return 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    } else if (friendshipStatus.hasReceivedRequest) {
      return 'bg-green-500 text-white hover:bg-green-600'
    } else {
      return 'bg-blue-500 text-white hover:bg-blue-600'
    }
  }

  return (
    <div className="mb-3 mt-4 flex w-full gap-2 px-4">
      {/* Friend request button */}
      <button
        onClick={onFriendRequest}
        disabled={isLoading}
        className={`flex h-full flex-1 items-center justify-center rounded-md py-2 font-semibold transition-all ${getButtonStyles()}`}
      >
        {getButtonLabel()}
      </button>

      {/* Message button */}
      <button
        onClick={onStartChat}
        className="flex h-full flex-1 items-center justify-center rounded-md bg-gray-200 py-2 font-semibold text-gray-700 transition-all hover:bg-gray-300"
      >
        <FaCommentDots className="mr-2" />
        Nhắn tin
      </button>
    </div>
  )
}

ProfileActions.propTypes = {
  isCurrentUser: PropTypes.bool.isRequired,
  friendshipStatus: PropTypes.shape({
    isFriend: PropTypes.bool.isRequired,
    hasSentRequest: PropTypes.bool.isRequired,
    hasReceivedRequest: PropTypes.bool.isRequired,
  }).isRequired,
  onFriendRequest: PropTypes.func.isRequired,
  onStartChat: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  userId: PropTypes.string,
}

export default ProfileActions
