import React from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../zustand/userStore";

const Chats = () => {
  const { logout } = useUserStore();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div>
      <h1>Chats</h1>
      <button
        onClick={handleLogout}
        className="border-2 border-black rounded-md px-4 py-2"
      >
        Log out
      </button>
    </div>
  );
};

export default Chats;
