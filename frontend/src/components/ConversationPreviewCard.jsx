import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const ConversationPreviewCard = ({ conversation, ...props }) => {
  const location = useLocation()
  const navigate = useNavigate()

  console.log(conversation)

  return (
    <li
      onClick={() => navigate(`/chat/${conversation?.id}`)}
      {...props}
      className={`flex h-[74px] cursor-pointer select-none items-stretch gap-4 px-3.5 py-3.5 hover:bg-gray-100 ${
        location.pathname === `/chat/${conversation?.id}`
          ? 'bg-blue-200 hover:!bg-blue-200'
          : ''
      }`}
    >
      <img
        src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2680&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt=""
        className="aspect-square h-12 w-12 rounded-full object-cover"
      />

      <div className="overflow-hidden">
        <div className="flex h-full items-center justify-center">
          <h3 className="line-clamp-1 text-ellipsis text-sm font-medium text-gray-900">
            {conversation?.fullname}
          </h3>
        </div>
      </div>
    </li>
  )
}

export default ConversationPreviewCard
