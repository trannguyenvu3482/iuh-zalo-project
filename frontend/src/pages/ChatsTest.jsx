import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useUserStore } from "../zustand/userStore";
const ChatsTest = () => {
  const { logout } = useUserStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase.from("messages").select("*");

      if (error) {
        console.log(error);
      }

      console.log(">> Messages: ", data);
      setMessages(data);
    };

    fetchMessages();
  }, []);

  // Realtime listener
  useEffect(() => {
    const channel = supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("Change received: ", payload);
          setMessages([...messages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from("messages")
      .insert([
        { text: inputMessage, send_by: "0e014799-8643-4b1f-b9dc-4635e43b48d8" },
      ]);

    if (error) {
      console.log(error);
    }

    setInputMessage("");
  };

  return (
    <div className="w-full max-h-screen">
      <div className="max-w-[1440px] mx-auto bg-blue-300 my-6 h-[800px] flex flex-col p-4">
        <h1 className="text-center font-bold text-2xl">Chats</h1>

        <ul>
          {messages.map((message) => (
            <li
              className="text-blue-500 font-bold bg-gray-300 w-fit py-2 px-4 rounded-md mt-2"
              key={message.id}
            >
              {message.text}
            </li>
          ))}
        </ul>

        <form>
          <input
            type="text"
            id="UserEmail"
            placeholder="Enter your message"
            className="mt-1 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 h-full"
            onChange={(e) => setInputMessage(e.target.value)}
            value={inputMessage}
          />

          <button
            type="submit"
            onClick={handleSendMessage}
            className="inline-block rounded border border-indigo-600 bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatsTest;
