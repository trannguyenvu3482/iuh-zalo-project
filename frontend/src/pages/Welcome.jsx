import React from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../zustand/userStore";

const Welcome = () => {
  const { logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center h-screen mt-40">
      <h1 className="text-2xl mb-4">
        Chào mừng đến với <span className="font-semibold">Zalo PC</span>!
      </h1>
      <span className="w-[420px] text-center text-sm">
        Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng người thân,
        bạn bè được tối ưu hoá cho máy tính của bạn.
      </span>
      <button
        className="mt-5 inline-block rounded border border-indigo-600 bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
        onClick={handleLogout}
      >
        Log out
      </button>
    </div>
  );
};

export default Welcome;
