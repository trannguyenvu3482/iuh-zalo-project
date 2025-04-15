import { useUserStore } from '../../zustand/userStore'
import { getSocket } from './index'

export const sendFriendRequest = (friendId) => {
  const socket = getSocket()
  const { user } = useUserStore.getState()
  console.log('Emitting friend_request event for friend:', friendId)

  socket.emit('friend_request', {
    friendId,
    from: user?.id,
    timestamp: new Date().toISOString(),
  })
}

export const respondToFriendRequest = (requestId, status, senderId) => {
  const socket = getSocket()
  const { user } = useUserStore.getState()
  console.log(`Emitting friend_${status} event for request:`, requestId)

  socket.emit(status === 'accepted' ? 'friend_accepted' : 'friend_rejected', {
    requestId,
    from: user?.id,
    senderId: senderId,
    timestamp: new Date().toISOString(),
  })
}

export const cancelFriendRequest = (friendId) => {
  const socket = getSocket()
  const { user } = useUserStore.getState()
  console.log('Emitting friend_request_canceled event for friend:', friendId)

  socket.emit('friend_request_canceled', {
    friendId,
    from: user?.id,
  })
}

export const onFriendRequestResponse = (callback) => {
  const socket = getSocket()

  const acceptHandler = (data) => {
    console.log('Received friend_accepted event:', data)
    callback({ ...data, status: 'accepted' })
  }

  const rejectHandler = (data) => {
    console.log('Received friend_rejected event:', data)
    callback({ ...data, status: 'rejected' })
  }

  socket.on('friend_accepted', acceptHandler)
  socket.on('friend_rejected', rejectHandler)

  return () => {
    socket.off('friend_accepted', acceptHandler)
    socket.off('friend_rejected', rejectHandler)
  }
}

export const onFriendRequest = (callback) => {
  const socket = getSocket()
  console.log('Setting up listener for friend_request events')

  const handleEvent = (data) => {
    console.log('Received friend_request event:', data)
    callback(data)
  }

  socket.on('friend_request', handleEvent)
  return () => socket.off('friend_request', handleEvent)
}

export const onFriendRequestCanceled = (callback) => {
  const socket = getSocket()
  console.log('Setting up listener for friend_request_canceled events')

  const handleEvent = (data) => {
    console.log('Received friend_request_canceled event:', data)
    callback(data)
  }

  socket.on('friend_request_canceled', handleEvent)
  return () => {
    console.log('Removing listener for friend_request_canceled events')
    socket.off('friend_request_canceled', handleEvent)
  }
}

export const onFriendRequestSent = (callback) => {
  const socket = getSocket()

  const handleEvent = (data) => {
    console.log('Received friend_request_sent event:', data)
    callback(data)
  }

  socket.on('friend_request_sent', handleEvent)
  return () => socket.off('friend_request_sent', handleEvent)
}

export const onFriendRequestDelivered = (callback) => {
  const socket = getSocket()
  console.log('Setting up listener for friend_request_delivered events')

  const handleEvent = (data) => {
    console.log('Received friend_request_delivered event:', data)
    callback(data)
  }

  socket.on('friend_request_delivered', handleEvent)
  return () => {
    socket.off('friend_request_delivered', handleEvent)
  }
}
