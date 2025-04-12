import { useEffect } from "react";

import { socketService } from "~/lib/socket";
import { useSocketStore } from "~/store/socketStore";

export const useSocket = (token: string) => {
  const {
    setConnected,
    addMessage,
    updateMessageStatus,
    incrementUnreadCount,
  } = useSocketStore();

  useEffect(() => {
    if (!token) return;

    // Connect to socket
    socketService.connect(token);

    // Set up event listeners
    socketService.on("connect", () => {
      setConnected(true);
    });

    socketService.on("disconnect", () => {
      setConnected(false);
    });

    socketService.on("message", (data) => {
      const { chatId, message } = data;
      addMessage(chatId, message);
      incrementUnreadCount(chatId);
    });

    socketService.on("message_status", (data) => {
      const { chatId, messageId, status } = data;
      updateMessageStatus(chatId, messageId, status);
    });

    // Cleanup
    return () => {
      socketService.off("connect");
      socketService.off("disconnect");
      socketService.off("message");
      socketService.off("message_status");
      socketService.disconnect();
    };
  }, [token]);

  const sendMessage = (chatId: string, content: string) => {
    socketService.emit("send_message", { chatId, content });
  };

  const markMessageAsRead = (chatId: string, messageId: string) => {
    socketService.emit("mark_message_read", { chatId, messageId });
  };

  return {
    sendMessage,
    markMessageAsRead,
  };
};
