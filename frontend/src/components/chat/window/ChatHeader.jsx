import PropTypes from 'prop-types'
import { FaEllipsisH } from 'react-icons/fa'

const ChatHeader = ({
  receiverInfo,
  onStartCall,
  onAvatarClick,
  onMenuClick,
  isSidebarOpen,
}) => {
  // For debugging only - shows what we're working with
  console.log('receiverInfo in ChatHeader:', JSON.stringify(receiverInfo))

  // Ensure we have avatar and fullName with fallbacks
  const avatar = receiverInfo?.avatar || 'https://via.placeholder.com/40'
  const fullName = receiverInfo?.fullName || 'Unknown User'

  // Create a properly structured user object that matches the expected format in ProfileDialog
  const handleAvatarClick = () => {
    console.log('Avatar clicked in ChatHeader, receiverInfo:', receiverInfo)

    if (onAvatarClick && receiverInfo && receiverInfo.id) {
      // The userId needs to be passed correctly for the ProfileDialog
      // Create a properly structured user object with the same format as MessageBubble
      const userForDialog = {
        id: receiverInfo.id,
        fullName: receiverInfo.fullName || receiverInfo.name,
        avatar: receiverInfo.avatar,
      }

      console.log('Passing to openProfileDialog:', userForDialog)
      onAvatarClick(userForDialog)
    } else {
      console.warn('Cannot open profile dialog: Missing receiverInfo or id')
    }
  }

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={avatar}
            alt={fullName}
            className="h-12 w-12 cursor-pointer rounded-full border border-gray-300 object-cover"
            onClick={handleAvatarClick}
          />
          <div className="flex flex-col items-start gap-0.5">
            <h3 className="ml-1 text-lg font-medium">{fullName}</h3>
            <span className="rounded-full bg-gray-300 px-2 py-1 text-xs">
              {receiverInfo?.isFriend ? '' : 'Người lạ'}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          {/* Audio Call Button */}
          <button
            type="button"
            className="rounded-full p-2 hover:bg-gray-100"
            onClick={() => onStartCall && onStartCall(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-gray-600"
            >
              <path
                fillRule="evenodd"
                d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Video Call Button */}
          <button
            type="button"
            className="rounded-full p-2 hover:bg-gray-100"
            onClick={() => onStartCall && onStartCall(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-gray-600"
            >
              <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
            </svg>
          </button>

          {/* Menu Button - Toggle for Sidebar */}
          <button
            type="button"
            className={`rounded-full p-2 transition-colors ${isSidebarOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            onClick={onMenuClick}
          >
            <FaEllipsisH className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

ChatHeader.propTypes = {
  receiverInfo: PropTypes.shape({
    fullName: PropTypes.string,
    name: PropTypes.string,
    avatar: PropTypes.string.isRequired,
    isFriend: PropTypes.bool,
    id: PropTypes.string,
  }).isRequired,
  onStartCall: PropTypes.func,
  onAvatarClick: PropTypes.func,
  onMenuClick: PropTypes.func,
  isSidebarOpen: PropTypes.bool,
}

ChatHeader.defaultProps = {
  onStartCall: () => {},
  onAvatarClick: () => {},
  onMenuClick: () => {},
  isSidebarOpen: false,
}

export default ChatHeader
