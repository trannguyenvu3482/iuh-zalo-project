import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ConversationPreviewCard = ({ user, isFriend, ...props }) => {
  const navigate = useNavigate()
  const [isSelected, setIsSelected] = useState(false)
  console.log(user, isFriend)

  const handleSelectConversation = () => {
    if (isFriend) {
      navigate(`/chats/${user?.id}`, {
        state: {
          isFriend,
          user,
        },
      })
    } else {
      navigate(`/chats`, {
        state: {
          isFriend,
          user,
        },
      })
    }
    setIsSelected(true)
  }

  return (
    <li
      onClick={handleSelectConversation}
      {...props}
      className={`flex h-[74px] cursor-pointer select-none items-stretch gap-4 px-3.5 py-3.5 hover:bg-gray-100 ${
        isSelected ? 'bg-blue-200 hover:!bg-blue-200' : ''
      }`}
    >
      <img
        src={user?.avatar}
        alt=""
        className="aspect-square h-12 w-12 rounded-full object-cover"
      />

      <div className="overflow-hidden">
        <div className="flex h-full flex-col items-start justify-center gap-1">
          <h3 className="line-clamp-1 text-ellipsis text-sm font-semibold text-gray-900">
            {user?.fullName}
          </h3>
          <h3 className="line-clamp-1 text-ellipsis text-sm font-semibold text-gray-900">
            Số điện thoại:{' '}
            <span className="text-primary-blue">{user?.phoneNumber}</span>
          </h3>
        </div>
      </div>
    </li>
  )
}

ConversationPreviewCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    fullName: PropTypes.string,
    avatar: PropTypes.string,
    phoneNumber: PropTypes.string,
  }),
  isFriend: PropTypes.bool,
}

ConversationPreviewCard.defaultProps = {
  isFriend: false,
  user: {},
}

export default ConversationPreviewCard
