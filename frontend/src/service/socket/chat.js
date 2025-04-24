import { v4 as uuidv4 } from 'uuid'
import { useUserStore } from '../../zustand/userStore'
import { getSocket } from './index'

export const sendPrivateMessage = (receiverId, message, conversationId) => {
  const socket = getSocket()
  const { user } = useUserStore.getState()

  // Make sure we have a proper user name to send
  const userData = {
    id: user?.id,
    fullName: user?.fullName || user?.name || 'You',
  }

  socket.emit('chat message', {
    receiverId,
    message,
    conversationId,
    senderId: userData.id,
    senderName: userData.fullName,
    isFromCurrentUser: true,
    timestamp: new Date().toISOString(),
  })
}

export const sendGroupMessage = (conversationId, message) => {
  const socket = getSocket()
  const { user } = useUserStore.getState()

  // Make sure we have a proper user name to send
  const userData = {
    id: user?.id,
    fullName: user?.fullName || user?.name || 'You',
  }

  socket.emit('chat message', {
    conversationId,
    message,
    senderId: userData.id,
    senderName: userData.fullName,
    isFromCurrentUser: true,
    timestamp: new Date().toISOString(),
  })
}

export const onNewMessage = (callback) => {
  const socket = getSocket()

  socket.off('new_message')

  socket.on('new_message', (data) => {
    console.log('Socket received new_message event with data:', data)

    const { user } = useUserStore.getState()

    // Deep copy the data to avoid modifying the original
    const messageData = JSON.parse(JSON.stringify(data))

    // Make sure we preserve the original senderName from the server - store it first before any processing
    const originalSenderName =
      data.senderName ||
      messageData.senderName ||
      (data.sender && typeof data.sender === 'object'
        ? data.sender.fullName
        : null)

    console.log('Preserved original sender name:', originalSenderName)

    // Process the sender object
    let senderObj = messageData.sender
    if (
      typeof messageData.sender === 'string' ||
      messageData.sender instanceof String
    ) {
      senderObj = {
        id: messageData.sender,
        fullName: originalSenderName || 'Unknown User',
        avatar: null,
      }
    } else if (
      messageData.sender === null ||
      messageData.sender === undefined
    ) {
      // If sender is null/undefined but we have senderId and senderName
      if (messageData.senderId) {
        senderObj = {
          id: messageData.senderId,
          fullName: originalSenderName || 'Unknown User',
          avatar: messageData.avatar || null,
        }
      }
    } else if (typeof messageData.sender === 'object') {
      // Fix: For sender object, prioritize the originalSenderName if it exists
      senderObj = {
        ...messageData.sender,
        fullName:
          originalSenderName || messageData.sender.fullName || 'Unknown User',
      }
    }

    const normalizedMessage = {
      ...messageData,
      id:
        messageData.id ||
        `socket-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: messageData.content || messageData.message,
      message: messageData.message || messageData.content,
      senderId: messageData.senderId || (senderObj && senderObj.id),
      sender: senderObj,
      // Explicitly preserve the senderName from the original message
      senderName:
        originalSenderName ||
        (senderObj && senderObj.fullName) ||
        'Unknown User',
      timestamp:
        messageData.timestamp ||
        messageData.created_at ||
        new Date().toISOString(),
      created_at:
        messageData.created_at ||
        messageData.timestamp ||
        new Date().toISOString(),
      isFromCurrentUser:
        messageData.isFromCurrentUser ||
        messageData.senderId === user?.id ||
        (senderObj && senderObj.id === user?.id),
    }

    console.log('Calling callback with normalized message:', normalizedMessage)
    callback(normalizedMessage)
  })

  return () => {
    console.log('Cleaning up new_message event listener')
    socket.off('new_message')
  }
}

export const sendTypingStatus = (conversationId, isTyping) => {
  const socket = getSocket()
  socket.emit(isTyping ? 'typing_start' : 'typing_end', { conversationId })
}

export const onTypingStatus = (callback) => {
  const socket = getSocket()

  const typingStartHandler = (data) => {
    callback({ ...data, isTyping: true })
  }

  const typingEndHandler = (data) => {
    callback({ ...data, isTyping: false })
  }

  socket.on('user_typing', typingStartHandler)
  socket.on('user_stopped_typing', typingEndHandler)

  return () => {
    socket.off('user_typing', typingStartHandler)
    socket.off('user_stopped_typing', typingEndHandler)
  }
}

export const markMessageAsRead = (messageId, conversationId) => {
  const socket = getSocket()
  socket.emit('message_read', { messageId, conversationId })
}

export const onMessageRead = (callback) => {
  const socket = getSocket()
  socket.on('message_read_update', callback)
  return () => socket.off('message_read_update', callback)
}

export function handleNewMessage(data, callback) {
  if (!data) return

  // Create a deep copy to avoid modifying the original data
  const msgData = JSON.parse(JSON.stringify(data))
  console.log('SOCKET - Received new message:', msgData)

  // Save the original sender name sent from the server - access from original data first
  const originalSenderName =
    data.senderName ||
    msgData.senderName ||
    (data.sender && typeof data.sender === 'object'
      ? data.sender.fullName
      : null)

  console.log('Original sender name:', originalSenderName)

  // Handle sender object or ID
  let senderObj = null

  if (msgData.sender) {
    if (typeof msgData.sender === 'object') {
      senderObj = {
        ...msgData.sender,
        fullName:
          originalSenderName || msgData.sender.fullName || 'Unknown User',
      }
    } else {
      // If sender is just an ID, create a proper sender object
      senderObj = {
        id: msgData.sender,
        fullName: originalSenderName || 'Unknown User',
      }
    }
  } else if (msgData.senderId) {
    senderObj = {
      id: msgData.senderId,
      fullName: originalSenderName || 'Unknown User',
    }
  }

  console.log('Normalized sender object:', senderObj)

  // Create the normalized message to return
  const normalizedMsg = {
    id: msgData.id || uuidv4(),
    content: msgData.content || msgData.message,
    message: msgData.content || msgData.message,
    sender: senderObj,
    senderName:
      originalSenderName || (senderObj && senderObj.fullName) || 'Unknown User',
    senderId: msgData.senderId || (senderObj && senderObj.id),
    timestamp: msgData.timestamp || new Date().toISOString(),
    conversationId: msgData.conversationId,
    receiverId: msgData.receiverId,
  }

  console.log('Normalized message:', normalizedMsg)

  if (callback && typeof callback === 'function') {
    callback(normalizedMsg)
  }

  return normalizedMsg
}
