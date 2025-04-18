import { useEffect } from "react";

import { socketService } from "~/lib/socket";
import { useSocketStore } from "~/store/socketStore";
import { useUserStore } from "~/store/userStore";

export const useSocket = (token: string) => {
  const {
    setConnected,
    addMessage,
    updateMessageStatus,
    incrementUnreadCount,
  } = useSocketStore();

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

    // Set up event listeners
    socketService.on("connect", () => {
      console.log("[useSocket] Socket connected event received");
      setConnected(true);
    });

    socketService.on("disconnect", () => {
      console.log("[useSocket] Socket disconnected event received");
      setConnected(false);
    });

    // Reset socket event listeners to ensure we don't have duplicates
    socketService.off("new_message");
    socketService.off("chat message");
    socketService.off("message_status");

    // Must use the same exact event name as the frontend
    socketService.on("new_message", (data) => {
      console.log("[useSocket] Received new_message event:", data);

      // Add essential fields if missing
      if (!data.id) {
        data.id = Date.now().toString();
        console.log("[useSocket] Added missing ID to message");
      }

      const {
        senderId,
        content,
        message,
        conversationId,
        receiverId,
        timestamp,
      } = data;

      // Determine the chat ID - could be conversationId or for direct messages the senderId
      const chatId =
        conversationId || (user?.id === senderId ? receiverId : senderId);

      if (!chatId) {
        console.error(
          "[useSocket] Cannot determine chat ID for message:",
          data,
        );
        return;
      }

      console.log(`[useSocket] Processing message for chat ${chatId}`);

      // Format message to match our store format
      const formattedMessage = {
        id: data.id,
        content: content || message || "",
        senderId: senderId || "",
        receiverId: receiverId || "",
        timestamp: timestamp || new Date().toISOString(),
        status: "sent" as const,
        sender: senderId === user?.id ? "me" : "other",
        type: "TEXT" as const,
        // Add sender object if it exists
        ...(data.sender && typeof data.sender === "object"
          ? { sender: data.sender }
          : {}),
        // Add other properties that might be present
        ...(data.type ? { type: data.type as "TEXT" } : {}),
        ...(data.file ? { file: data.file } : {}),
        ...(data.reaction ? { reaction: data.reaction } : {}),
      };

      console.log(
        `[useSocket] Adding message to chat ${chatId}:`,
        formattedMessage,
      );

      // Add message to the store with a slight delay to ensure UI updates
      setTimeout(() => {
        addMessage(chatId, formattedMessage);
        console.log(`[useSocket] Added delayed message to chat ${chatId}`);

        // Only increment unread count if message is not from current user
        if (senderId !== user?.id) {
          incrementUnreadCount(chatId);
        }
      }, 100);
    });

    // Also listen for direct chat message events (legacy format)
    socketService.on("chat message", (data) => {
      console.log("[useSocket] Received chat message event:", data);

      // Add essential fields if missing
      if (!data.id) {
        data.id = Date.now().toString();
        console.log("[useSocket] Added missing ID to chat message");
      }

      // Transform to expected format and forward to new_message handler
      const transformedData = {
        ...data,
        content: data.message || data.content || "",
      };

      console.log(
        "[useSocket] Transformed chat message data:",
        transformedData,
      );

      // IMPORTANT: Directly process this message using the same logic
      // as the new_message handler instead of trying to trigger that handler
      const {
        senderId,
        content,
        message,
        conversationId,
        receiverId,
        timestamp,
      } = transformedData;

      // Determine the chat ID
      const chatId =
        conversationId || (user?.id === senderId ? receiverId : senderId);

      if (!chatId) {
        console.error(
          "[useSocket] Cannot determine chat ID for message:",
          transformedData,
        );
        return;
      }

      console.log(`[useSocket] Processing chat message for chat ${chatId}`);

      // Format message to match our store format
      const formattedMessage = {
        id: transformedData.id,
        content: content || message || "",
        senderId: senderId || "",
        receiverId: receiverId || "",
        timestamp: timestamp || new Date().toISOString(),
        status: "sent" as const,
        sender: senderId === user?.id ? "me" : "other",
        type: "TEXT" as const, // Safe default
        // Add sender object if it exists
        ...(transformedData.sender && typeof transformedData.sender === "object"
          ? { sender: transformedData.sender }
          : {}),
        // Add other properties that might be present - safely typed
        ...(transformedData.type ? { type: transformedData.type as any } : {}),
        ...(transformedData.file ? { file: transformedData.file } : {}),
        ...(transformedData.reaction
          ? { reaction: transformedData.reaction }
          : {}),
      };

      console.log(
        `[useSocket] Adding chat message to chat ${chatId}:`,
        formattedMessage,
      );

      // Add to store - with delay to ensure UI updates
      setTimeout(() => {
        addMessage(chatId, formattedMessage);
        console.log(`[useSocket] Added delayed chat message to chat ${chatId}`);

        // Only increment unread count if message is not from current user
        if (senderId !== user?.id) {
          incrementUnreadCount(chatId);
        }
      }, 100);
    });

    socketService.on("message_status", (data) => {
      console.log("[useSocket] Received message_status event:", data);
      const { chatId, messageId, status } = data;
      updateMessageStatus(chatId, messageId, status);
    });

    // Join conversation room when chat ID is available
    if (user?.id) {
      // Always join the user's own room
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
      socketService.off("chat message");
      socketService.off("message_status");
    };
  }, [token, user?.id, user?.fullName]);

  const sendMessage = (chatId: string, content: string) => {
    console.log("[useSocket] Sending message via socket:", { chatId, content });

    // Check connection first to avoid unnecessary steps if disconnected
    if (!socketService.isConnected()) {
      console.warn("[useSocket] Socket not connected, cannot send message");
      return false;
    }

    try {
      // Use our enhanced sendChatMessage method that formats data correctly
      socketService.sendChatMessage({
        conversationId: chatId,
        message: content,
      });

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
