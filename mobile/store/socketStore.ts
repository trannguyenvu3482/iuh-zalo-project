import { create } from "zustand";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date | string;
  status: "sent" | "delivered" | "read";
  sender?: any; // Allow any type for sender to handle "me" | "other" or User object
  type?: any; // Allow any type for type to handle different message types
  reaction?: any; // Allow reaction field
  file?: any; // Allow file field
}
interface Friend {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline"; // Trạng thái bạn bè
  friendshipStatus: "PENDING" | "ACCEPTED" | "REJECTED"; // Trạng thái kết bạn
}

interface SocketState {
  isConnected: boolean;
  messages: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  friends: Friend[]; // Danh sách bạn bè
  setConnected: (connected: boolean) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessageStatus: (
    chatId: string,
    messageId: string,
    status: Message["status"],
  ) => void;
  incrementUnreadCount: (chatId: string) => void;
  resetUnreadCount: (chatId: string) => void;
  setFriends: (friends: Friend[]) => void;
  updateFriendStatus: (
    friendId: string,
    status: "online" | "offline",
  ) => void; // Cập nhật trạng thái online/offline
  updateFriendshipStatus: (
    friendId: string,
    friendshipStatus: "PENDING" | "ACCEPTED" | "REJECTED",
  ) => void; // Cập nhật trạng thái kết bạn
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  messages: {},
  unreadCounts: {},
  friends: [],

  setConnected: (connected) => set({ isConnected: connected }),

  addMessage: (chatId, message) =>
    set((state) => {
      console.log(`[SocketStore] Adding message to chat ${chatId}:`, message);

      // Get current messages for this chat
      const currentMessages = state.messages[chatId] || [];

      // Check if message already exists to avoid duplicates
      const messageExists = currentMessages.some((m) => m.id === message.id);
      if (messageExists) {
        console.log(
          `[SocketStore] Message ${message.id} already exists, not adding`,
        );
        return state; // Return unchanged state
      }

      // Add the new message
      const newMessages = [...currentMessages, message];
      console.log(
        `[SocketStore] Chat ${chatId} now has ${newMessages.length} messages`,
      );

      // Return new state with updated messages
      return {
        messages: {
          ...state.messages,
          [chatId]: newMessages,
        },
      };
    }),
  updateMessageStatus: (chatId, messageId, status) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: state.messages[chatId]?.map((msg) =>
          msg.id === messageId ? { ...msg, status } : msg,
        ),
      },
    })),
  incrementUnreadCount: (chatId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: (state.unreadCounts[chatId] || 0) + 1,
      },
    })),
  resetUnreadCount: (chatId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: 0,
      },
    })),
  // Cập nhật toàn bộ danh sách bạn bè
  setFriends: (friends) =>
    set({
      friends,
    }),

  // Cập nhật trạng thái online/offline của một bạn bè
  updateFriendStatus: (friendId, status) =>
    set((state) => ({
      friends: state.friends.map((friend) =>
        friend.id === friendId ? { ...friend, status } : friend,
      ),
    })),

  // Cập nhật trạng thái kết bạn (PENDING, ACCEPTED, REJECTED)
  updateFriendshipStatus: (friendId, friendshipStatus) =>
    set((state) => ({
      friends: state.friends.map((friend) =>
        friend.id === friendId
          ? { ...friend, friendshipStatus }
          : friend,
      ),
    })),
}));
