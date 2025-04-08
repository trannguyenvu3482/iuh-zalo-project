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
  
  console.log('Socket initialization requested', {
    socketExists: Boolean(socket),
    socketConnected: socket?.connected,
    userAvailable: Boolean(user),
    authTokenAvailable: Boolean(accessToken),
    isInitializing,
    socketId: socket?.id
  });
  
  // If we're already initializing, return the current socket
  if (isInitializing) {
    console.log('Socket initialization already in progress, returning current socket');
    return socket;
  }
  
  // If socket exists and is connected, reuse it
  if (socket && socket.connected) {
    console.log('Reusing existing connected socket with ID:', socket.id);
    return socket;
  }
  
  isInitializing = true;
  console.log('Starting new socket initialization');
  
  // If socket exists but not connected, clean up first
  if (socket) {
    console.log('Cleaning up existing disconnected socket with ID:', socket.id);
    
    // Remove all listeners to prevent memory leaks and multiple handlers
    console.log('Removing all socket event listeners');
    socket.removeAllListeners();
    
    // Disconnect the socket
    socket.disconnect();
    socket = null;
  }
  
  // Check for required connection data
  if (!user?.id) {
    console.error('Cannot initialize socket: user ID not available');
    isInitializing = false;
    return null;
  }
  
  console.log(`Connecting to socket server at: ${SOCKET_URL}`);
  
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
  
  console.log('Socket initialized with user ID in query:', user?.id);
  
  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected successfully with ID:', socket.id);
    isInitializing = false;
    
    // Join user's personal room
    if (user && user.id) {
      // Important: Join the user's room for receiving calls
      socket.emit('join', `user_${user.id}`);
      console.log(`Joined personal room: user_${user.id}`);
      
      // Explicitly verify joining was successful after a short delay
      setTimeout(() => {
        socket.emit('check:user:connected', { userId: user.id }, (response) => {
          console.log(`Room joining verification for user ${user.id}:`, response);
          if (!response?.isConnected) {
            console.warn('User room joining may have failed, attempting again');
            socket.emit('join', `user_${user.id}`);
          }
        });
      }, 1000);
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
  
  socket.on('call:accepted', (data) => {
    console.log('DEBUG: Received call accepted event:', {
      callerId: data?.callerId,
      calleeId: data?.calleeId, 
      callerName: data?.callerName,
      calleeName: data?.calleeName,
      channelName: data?.channelName,
      hasToken: !!data?.token,
      timestamp: data?.timestamp,
      socketId: socket.id,
      socketConnected: socket.connected
    });
    
    // Critical validation
    if (!data || !data.channelName) {
      console.error('Missing channelName in call:accepted data!', data);
      return;
    }
    
    // IMPORTANT: When a call is accepted, ensure the caller transitions to the connected state
    try {
      // First, dispatch event to current window (this is the most reliable approach)
      window.dispatchEvent(new CustomEvent('call:accepted', { detail: data }));
      console.log('Dispatched call:accepted event to current window with channel:', data?.channelName);
      
      // Then try to update the call window if needed
      if (data && data.channelName) {
        import('../utils/callUtils').then(callUtils => {
          try {
            // Use the new navigate approach instead of window management
            console.log('Redirecting to call page with channel:', data.channelName);
            callUtils.navigateToCall({
              calleeId: data.calleeId,
              callerId: data.callerId,
              callerName: data.callerName,
              calleeName: data.calleeName,
              channelName: data.channelName,
              callType: data.type || 'video'
            });
          } catch (error) {
            console.error('Error handling call navigation:', error);
          }
        }).catch(error => {
          console.error('Error importing callUtils:', error);
        });
      } else {
        console.error('Missing channelName in call:accepted data:', data);
      }
    } catch (error) {
      console.error('Error handling call acceptance:', error);
    }
  });
  
  socket.on('call:rejected', (data) => {
    console.log('DEBUG: Received call rejected event:', {
      callerId: data?.callerId,
      calleeId: data?.calleeId,
      reason: data?.reason,
      timestamp: data?.timestamp,
      socketId: socket.id,
      socketConnected: socket.connected
    });
    
    // Dispatch custom event for better cross-component communication
    try {
      // First, dispatch global event
      console.log('Dispatching custom call:rejected event to window');
      window.dispatchEvent(new CustomEvent('call:rejected', { detail: data }));
    } catch (error) {
      console.error('Error dispatching call rejection event:', error);
    }
  });
  
  socket.on('call:ended', (data) => {
    console.log('DEBUG: Received call ended event:', {
      ...data,
      socketId: socket.id,
      socketConnected: socket.connected
    });
  });
  
  // Add error handling for call events
  socket.on('error', (error) => {
    console.error('Socket error:', error);
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
    console.log('Explicitly disconnecting socket with ID:', socket.id);
    
    try {
      // Remove all listeners first
      socket.removeAllListeners();
      
      // Then disconnect
      socket.disconnect();
      
      // Set socket to null to ensure a new one is created on reconnect
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