import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ChatRoom = ({ id, ...props }) => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <li
      onClick={() => navigate(`/chat/${id}`)}
      {...props}
      className={`flex items-stretch gap-4 h-[74px] hover:bg-gray-100 px-3.5 py-3.5 cursor-pointer select-none ${
        location.pathname === `/chat/${id}`
          ? "bg-blue-200 hover:bg-blue-200"
          : ""
      }`}
    >
      <img
        src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2680&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt=""
        className="aspect-square w-12 h-12 rounded-full object-cover"
      />

      <div className="overflow-hidden">
        <div className="flex gap-1 items-center justify-between">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-1 text-ellipsis overflow-hidden w-[180px]">
            Test Group
          </h3>
          <div className="flex items-center flex-row">
            <span className="text-xs">2 ngày</span>
          </div>
        </div>

        <p className="mt-0.5 text-gray-600 text-sm line-clamp-1">
          Nguyễn Trọng Tiến đổi tên nhóm thanh
        </p>
      </div>
    </li>
  );
};

export default ChatRoom;
