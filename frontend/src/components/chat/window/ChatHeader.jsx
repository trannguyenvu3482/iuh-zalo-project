import PropTypes from 'prop-types'

const ChatHeader = ({ receiverInfo, onStartCall }) => {
  return (
    <div className="border-b border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={receiverInfo.avatar}
            alt={receiverInfo.name}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium">{receiverInfo.name}</h3>
            <span className="text-xs text-gray-500">
              {receiverInfo.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          {/* Audio Call Button */}
          <button
            type="button"
            className="rounded-full p-2 hover:bg-gray-100"
            onClick={() => onStartCall(false)}
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
            onClick={() => onStartCall(true)}
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

          {/* Menu Button */}
          <button type="button" className="rounded-full p-2 hover:bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-gray-600"
            >
              <path
                fillRule="evenodd"
                d="M10.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0Zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0Zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

ChatHeader.propTypes = {
  receiverInfo: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
    isOnline: PropTypes.bool,
  }).isRequired,
  onStartCall: PropTypes.func.isRequired,
}

export default ChatHeader
