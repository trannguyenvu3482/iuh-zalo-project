import PropTypes from 'prop-types'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatLastActivity } from '../utils/dateUtils'

const ChatRoom = ({
  id,
  name = 'Conversation',
  avatar = null,
  lastMessage = null,
  lastActivity = null,
  type = 'PRIVATE',
  ...props
}) => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <li
      onClick={() => navigate(`/chat/${id}`)}
      {...props}
      className={`flex h-[74px] cursor-pointer select-none items-start justify-between px-3.5 py-3.5 hover:bg-gray-100 ${
        location.pathname === `/chat/${id}`
          ? 'bg-blue-200 hover:!bg-blue-200'
          : ''
      }`}
    >
      {/* Left side - Avatar and message content */}
      <div className="flex items-center gap-3">
        <img
          src={avatar || 'https://avatar.iran.liara.run/public/44'}
          alt={name}
          className="aspect-square h-12 w-12 rounded-full object-cover"
        />

        <div className="overflow-hidden">
          <h3 className="line-clamp-1 overflow-hidden text-ellipsis text-sm font-medium text-gray-900">
            {name}
            {type === 'GROUP' && (
              <span className="ml-1 text-xs text-gray-500">(Group)</span>
            )}
          </h3>

          <p className="mt-0.5 line-clamp-1 text-sm text-gray-600">
            {lastMessage?.content || `[Thiệp] Gửi lời chào đến ${name}`}
          </p>
        </div>
      </div>

      {/* Right side - Time */}
      <div className="flex-shrink-0 pl-2">
        <span className="text-xs text-gray-500">
          {formatLastActivity(lastActivity)}
        </span>
      </div>
    </li>
  )
}

ChatRoom.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  avatar: PropTypes.string,
  lastMessage: PropTypes.shape({
    content: PropTypes.string,
    senderId: PropTypes.string,
  }),
  lastActivity: PropTypes.string,
  type: PropTypes.oneOf(['PRIVATE', 'GROUP']),
}

export default ChatRoom
