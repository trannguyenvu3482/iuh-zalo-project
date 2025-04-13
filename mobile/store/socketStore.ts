import { create } from "zustand";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
}

interface SocketState {
  isConnected: boolean;
  messages: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  setConnected: (connected: boolean) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessageStatus: (
    chatId: string,
    messageId: string,
    status: Message["status"],
  ) => void;
  incrementUnreadCount: (chatId: string) => void;
  resetUnreadCount: (chatId: string) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  messages: {},
  unreadCounts: {},
  setConnected: (connected) => set({ isConnected: connected }),
  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),
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
}));
