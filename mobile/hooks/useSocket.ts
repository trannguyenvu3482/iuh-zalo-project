import { useEffect } from "react";

import { socketService } from "~/lib/socket";
import { useSocketStore } from "~/store/socketStore";
import { useUserStore } from "~/store/userStore";

export const useSocket = () => {
  const { setConnected, addMessage, updateMessageStatus } = useSocketStore();
  const { user } = useUserStore();

  useEffect(() => {
    console.log("useSocket: ", user);
    if (!user) return;

    // Connect to socket with userId and name
    const userName = user?.fullName || "Unknown User";
    console.log(
      "[useSocket] Setting up socket connection with token and user ID:",
      user?.id,
      userName,
    );

    // Connect to the socket
    socketService.connect(user.id, userName);

    // Set up basic connection event listeners only
    socketService.on("connect", () => {
      console.log("[useSocket] Socket connected event received");
      setConnected(true);
    });

    socketService.on("disconnect", () => {
      console.log("[useSocket] Socket disconnected event received");
      setConnected(false);
    });

    // Listen for new messages but only process messages from OTHER users
    socketService.on("new_message", (data) => {
      console.log("[useSocket] Received new_message event:", data);

      if (!data.id) {
        data.id = Date.now().toString();
      }

      const { senderId, conversationId } = data;

      // Only process messages from OTHER users (not current user)
      // This prevents duplication for sent messages
      if (senderId === user?.id) {
        console.log("[useSocket] Skipping own message to prevent duplication");
        return;
      }

      // Determine chat ID for the message
      const chatId =
        conversationId || (senderId !== user?.id ? senderId : data.receiverId);

      if (!chatId) {
        console.error(
          "[useSocket] Cannot determine chat ID for message:",
          data,
        );
        return;
      }

      // Format message for store
      const formattedMessage = {
        id: data.id,
        content: data.content || data.message || "",
        senderId: senderId || "",
        receiverId: data.receiverId || "",
        timestamp: data.timestamp || new Date().toISOString(),
        status: "sent" as const,
        sender: "other",
        type: data.type || "TEXT",
        ...(data.sender && typeof data.sender === "object"
          ? { sender: data.sender }
          : {}),
        ...(data.file ? { file: data.file } : {}),
        ...(data.reaction ? { reaction: data.reaction } : {}),
      };
      console.log(
        `[useSocket] Adding message from other user to chat ${chatId}`,
      );
      addMessage(chatId, formattedMessage);
    });

    socketService.on("message_status", (data) => {
      console.log("[useSocket] Received message_status event:", data);
      const { chatId, messageId, status } = data;
      updateMessageStatus(chatId, messageId, status);
    });

    // Join user's own room for receiving direct messages
    if (user?.id) {
      const userRoom = `user_${user.id}`;
      console.log(`[useSocket] Joining user room: ${userRoom}`);
      socketService.emit("join", userRoom);
    }

    // Cleanup
    return () => {
      console.log("[useSocket] Cleaning up socket connection");
      socketService.off("connect");
      socketService.off("disconnect");
      socketService.off("new_message");
      socketService.off("message_status");
    };
  }, [user?.id, user?.fullName]);

  const sendMessage = (chatId: string, content: string) => {
    console.log("[useSocket] Sending message via socket:", { chatId, content });

    // Check connection first to avoid unnecessary steps if disconnected
    if (!socketService.isSocketConnected()) {
      console.warn("[useSocket] Socket not connected, cannot send message");
      return false;
    }

    try {
      // Use the correct sendChatMessage method signature
      socketService.sendChatMessage(chatId, content);

      // Also explicitly join the conversation room to ensure we receive responses
      socketService.joinConversation(chatId);

      return true;
    } catch (error) {
      console.error("[useSocket] Error sending message:", error);
      return false;
    }
  };

  const markMessageAsRead = (chatId: string, messageId: string) => {
    console.log("[useSocket] Marking message as read:", { chatId, messageId });
    socketService.emit("message_read", { messageId, conversationId: chatId });
  };

  return {
    sendMessage,
    markMessageAsRead,
    joinConversation: (conversationId: string) => {
      console.log(`[useSocket] Calling joinConversation for ${conversationId}`);
      return socketService.joinConversation(conversationId);
    },
  };
};
