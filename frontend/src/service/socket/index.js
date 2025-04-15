import { io } from 'socket.io-client'
import { useUserStore } from '../../zustand/userStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8081'
let socket = null

export const getSocket = () => {
  const { user } = useUserStore.getState()

  if (!socket) {
    console.log('Initializing socket for user:', user?.id)

    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      transports: ['websocket'],
      query: user
        ? {
            userId: user.id,
            name: user.fullName || user.name || 'Unknown User',
          }
        : {},
    })

    // Add detailed event handling
    socket.on('connect', () => {
      console.log('Socket connected successfully with ID:', socket.id)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message, error)
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`)
    })

    socket.on('reconnect', () => {
      console.log('Socket reconnected:', socket.id)
    })

    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after multiple attempts')
    })

    socket.on('joined-room', (roomName) => {
      console.log(`Successfully joined room: ${roomName}`)
    })

    // Global event handler for debugging
    socket.onAny((event, ...args) => {
      console.log(`Socket event received: ${event}`, args)
    })

    console.log('Socket initialized with query params:', socket.io.opts.query)
  }

  if (socket && !socket.connected) {
    console.log(
      'Socket exists but disconnected, reconnecting for user:',
      user?.id,
    )

    // Update socket auth parameters in case user changed
    if (user && socket.io?.opts?.query) {
      socket.io.opts.query = {
        userId: user.id,
        name: user.fullName || user.name || 'Unknown User',
      }
      console.log('Updated socket query params:', socket.io.opts.query)
    }

    socket.connect()
  }

  return socket
}

export * from './chat'
export * from './friends'
export * from './status'
export { disconnectSocket } from './utils'
