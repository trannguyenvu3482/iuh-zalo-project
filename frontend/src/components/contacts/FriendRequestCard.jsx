import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import PropTypes from 'prop-types'

const FriendRequestCard = ({
  requestFriend,
  onAccept,
  onReject,
  type = 'received',
}) => {
  // Format date
  const formatRequestDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return format(date, 'dd/MM', { locale: vi })
    } catch {
      return dateString
    }
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={requestFriend?.avatar}
            alt={requestFriend?.fullName || 'User'}
            className="h-12 w-12 rounded-full border border-gray-200"
          />
          <div>
            <h3 className="font-medium">{requestFriend?.fullName}</h3>
            <p className="text-sm text-gray-500">Từ số điện thoại</p>
          </div>
        </div>

        {type === 'received' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReject(requestFriend?.id)}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Từ chối
            </button>
            <button
              onClick={() => onAccept(requestFriend?.id)}
              className="rounded-md bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
            >
              Đồng ý
            </button>
          </div>
        ) : (
          <button
            onClick={() => onReject(requestFriend?.id)}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Thu hồi
          </button>
        )}
      </div>

      {requestFriend.message && type === 'received' && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
          {requestFriend.message}
        </div>
      )}
    </div>
  )
}

FriendRequestCard.propTypes = {
  requestFriend: PropTypes.shape({
    id: PropTypes.string.isRequired,
    fullName: PropTypes.string,
    avatar: PropTypes.string,
    createdAt: PropTypes.string,
    message: PropTypes.string,
  }).isRequired,
  onAccept: PropTypes.func,
  onReject: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['received', 'sent']),
}

export default FriendRequestCard
