import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const ChatRoom = ({ id, ...props }) => {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <li
      onClick={() => navigate(`/chat/${id}`)}
      {...props}
      className={`flex h-[74px] cursor-pointer select-none items-stretch gap-4 px-3.5 py-3.5 hover:bg-gray-100 ${
        location.pathname === `/chat/${id}`
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
        <div className="flex items-center justify-between gap-1">
          <h3 className="line-clamp-1 w-[180px] overflow-hidden text-ellipsis text-sm font-medium text-gray-900">
            Test Group
          </h3>
          <div className="flex flex-row items-center">
            <span className="text-xs">2 ngày</span>
          </div>
        </div>

        <p className="mt-0.5 line-clamp-1 text-sm text-gray-600">
          Nguyễn Trọng Tiến đổi tên nhóm thanh
        </p>
      </div>
    </li>
  )
}

export default ChatRoom
