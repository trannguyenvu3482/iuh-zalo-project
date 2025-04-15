import { useUserStore } from '../../zustand/userStore'
import { getSocket } from './index'

export const sendPrivateMessage = (receiverId, message) => {
  const socket = getSocket()
  const { user } = useUserStore.getState()

  socket.emit('chat message', {
    receiverId,
    message,
    senderId: user?.id,
    senderName: user?.fullName || user?.name,
    isFromCurrentUser: true,
  })
}

export const sendGroupMessage = (conversationId, message) => {
  const socket = getSocket()
  const { user } = useUserStore.getState()

  socket.emit('chat message', {
    conversationId,
    message,
    senderId: user?.id,
    senderName: user?.fullName || user?.name,
    isFromCurrentUser: true,
  })
}

export const onNewMessage = (callback) => {
  const socket = getSocket()
  socket.on('new_message', callback)
  return () => socket.off('new_message', callback)
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
