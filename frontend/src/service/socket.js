import { io } from 'socket.io-client';
import { useUserStore } from '../zustand/userStore';

// Get the base URL from environment variables or use the default
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8081';

// Create socket instance
let socket = null;

// Initialize socket connection
const initializeSocket = () => {
  try {
    if (!socket) {
      console.log('Creating new socket instance');
      
      // More detailed socket options
      socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        transports: ['websocket'],
      });

      // Add more detailed event handling
      socket.on('connect', () => {
        console.log('Socket connected successfully with ID:', socket.id);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message, error);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket reconnection attempt ${attemptNumber}`);
      });

      socket.on('reconnect', () => {
        console.log('Socket reconnected:', socket.id);
      });

      socket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed after multiple attempts');
      });

      // Add debug handlers for room events
      socket.on('joined-room', (roomName) => {
        console.log(`Successfully joined room: ${roomName}`);
      });

      // This will register a global handler for all events
      socket.onAny((event, ...args) => {
        console.log(`Socket event received: ${event}`, args);
      });
    }
    
    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    throw error;
  }
};

// Get the socket instance, create it if it doesn't exist
const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  if (!socket.connected) {
    console.log('Socket exists but disconnected, reconnecting');
    socket.connect();
  }
  return socket;
};

// Export functions
export { getSocket, initializeSocket, socket };

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('Explicitly disconnecting socket with ID:', socket.id);
    try {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
      console.log('Socket disconnected and nullified successfully');
    } catch (error) {
      console.error('Error disconnecting socket:', error);
    }
  } else {
    console.log('No socket to disconnect');
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