import { io } from 'socket.io-client';
import { useUserStore } from '../zustand/userStore';

// Get the base URL from environment variables or use the default
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8081';

// Create a socket instance
let socket = null;
let isInitializing = false;

/**
 * Initialize socket connection with authentication
 */
export const initializeSocket = () => {
  const { accessToken, user } = useUserStore.getState();
  
  // If we're already initializing, return the current socket
  if (isInitializing) {
    return socket;
  }
  
  // If socket exists and is connected, reuse it
  if (socket && socket.connected) {
    return socket;
  }
  
  isInitializing = true;
  
  // If socket exists but not connected, clean up first
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  
  // Create new socket connection with auth token
  socket = io(SOCKET_URL, {
    auth: {
      token: accessToken
    },
    query: {
      userId: user?.id
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket']
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected successfully');
    isInitializing = false;
    
    // Join user's personal room
    if (user && user.id) {
      socket.emit('join', `user_${user.id}`);
    }
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    isInitializing = false;
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    isInitializing = false;
  });
  
  return socket;
};

/**
 * Get the socket instance, initialize if not exists
 */
export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Event listeners for messages
 */
export const onNewMessage = (callback) => {
  const socket = getSocket();
  socket.on('new_message', callback);
  
  // Return cleanup function
  return () => socket.off('new_message', callback);
};

/**
 * Event listeners for friend requests
 */
export const onFriendRequest = (callback) => {
  const socket = getSocket();
  socket.on('friend_request', callback);
  
  // Return cleanup function
  return () => socket.off('friend_request', callback);
};

/**
 * Event listeners for friend request responses
 */
export const onFriendRequestResponse = (callback) => {
  const socket = getSocket();
  socket.on('friend_accepted', callback);
  
  // Return cleanup function
  return () => socket.off('friend_accepted', callback);
};

/**
 * Event listeners for user status changes
 */
export const onUserStatusChange = (callback) => {
  const socket = getSocket();
  socket.on('user_status_update', callback);
  
  // Return cleanup function
  return () => socket.off('user_status_update', callback);
};

/**
 * Send a message to a private chat
 */
export const sendPrivateMessage = (receiverId, message) => {
  const socket = getSocket();
  const { user } = useUserStore.getState();
  
  socket.emit('chat message', { 
    receiverId, 
    message,
    senderId: user?.id,
    senderName: user?.fullname || user?.name,
    isFromCurrentUser: true
  });
};

/**
 * Send a message to a group chat
 */
export const sendGroupMessage = (conversationId, message) => {
  const socket = getSocket();
  const { user } = useUserStore.getState();
  
  socket.emit('chat message', { 
    conversationId, 
    message,
    senderId: user?.id,
    senderName: user?.fullname || user?.name,
    isFromCurrentUser: true
  });
};

/**
 * Send a friend request
 */
export const sendFriendRequest = (recipientId) => {
  const socket = getSocket();
  socket.emit('friend_request', { to: recipientId });
};

/**
 * Respond to a friend request
 */
export const respondToFriendRequest = (requestId, status) => {
  const socket = getSocket();
  if (status === 'accepted') {
    socket.emit('friend_accepted', { requestId });
  } else {
    socket.emit('friend_rejected', { requestId });
  }
};

/**
 * Notify typing status
 */
export const sendTypingStatus = (conversationId, isTyping) => {
  const socket = getSocket();
  if (isTyping) {
    socket.emit('typing_start', { conversationId });
  } else {
    socket.emit('typing_end', { conversationId });
  }
};

/**
 * Listen for typing status
 */
export const onTypingStatus = (callback) => {
  const socket = getSocket();
  
  const typingStartHandler = (data) => {
    callback({ ...data, isTyping: true });
  };
  
  const typingEndHandler = (data) => {
    callback({ ...data, isTyping: false });
  };
  
  socket.on('user_typing', typingStartHandler);
  socket.on('user_stopped_typing', typingEndHandler);
  
  // Return cleanup function
  return () => {
    socket.off('user_typing', typingStartHandler);
    socket.off('user_stopped_typing', typingEndHandler);
  };
};

/**
 * Emit read message status
 */
export const markMessageAsRead = (messageId, conversationId) => {
  const socket = getSocket();
  socket.emit('message_read', { messageId, conversationId });
};

/**
 * Listen for message read status updates
 */
export const onMessageRead = (callback) => {
  const socket = getSocket();
  socket.on('message_read_update', callback);
  
  // Return cleanup function
  return () => socket.off('message_read_update', callback);
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  onNewMessage,
  onFriendRequest,
  onFriendRequestResponse,
  onUserStatusChange,
  onTypingStatus,
  onMessageRead,
  sendPrivateMessage,
  sendGroupMessage,
  sendFriendRequest,
  respondToFriendRequest,
  sendTypingStatus,
  markMessageAsRead
}; 