import { getSocket } from './index'

export const onProfileUpdated = (callback) => {
  const socket = getSocket()
  socket.on('user:profile_updated', callback)
  return () => socket.off('user:profile_updated', callback)
}

export const onUserStatusChange = (callback) => {
  const socket = getSocket()
  socket.on('user_status_update', callback)
  return () => socket.off('user_status_update', callback)
}
