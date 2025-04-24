import { io } from 'socket.io-client'
import { useUserStore } from '../../zustand/userStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8081'
let socket = null
let reconnectTimer = null

// Export a function to forcibly reconnect the socket
export const reconnectSocket = () => {
  console.log('Force reconnecting socket...')
  if (socket) {
    socket.disconnect()
    // Small delay before reconnecting
    setTimeout(() => {
      socket.connect()
    }, 300)
  } else {
    // If no socket exists, create a new one
    getSocket()
  }
}

export const getSocket = () => {
  const { user } = useUserStore.getState()

  if (!socket) {
    console.log('Initializing socket for user:', user?.id)

    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
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
      // Clear any reconnect timer
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message, error)
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)

      // If the server closed the connection, try to reconnect manually
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Set a timer to reconnect after 3 seconds
        reconnectTimer = setTimeout(() => {
          console.log('Attempting manual reconnect after server disconnect')
          socket.connect()
        }, 3000)
      }
    })

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`)
      // Update socket auth parameters on reconnection attempts
      if (user && socket.io?.opts?.query) {
        socket.io.opts.query = {
          userId: user.id,
          name: user.fullName || user.name || 'Unknown User',
        }
        console.log(
          'Updated socket query params for reconnection attempt:',
          socket.io.opts.query,
        )
      }
    })

    socket.on('reconnect', () => {
      console.log('Socket reconnected:', socket.id)
    })

    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after multiple attempts')
      // Try one more manual reconnect after a delay
      setTimeout(() => {
        console.log('Attempting manual reconnect after reconnection failure')
        socket.connect()
      }, 5000)
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

    // Also check connection status after a brief delay and reconnect if needed
    setTimeout(() => {
      if (!socket.connected) {
        console.log(
          'Socket still disconnected after connect attempt, forcing reconnect',
        )
        socket.disconnect()
        socket.connect()
      }
    }, 2000)
  }

  return socket
}

// Periodically check socket connection and reconnect if needed
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (socket && !socket.connected) {
      console.log(
        'Periodic check: Socket disconnected, attempting to reconnect',
      )
      socket.connect()
    }
  }, 30000) // Check every 30 seconds
}

export * from './chat'
export * from './friends'
export * from './status'
export { disconnectSocket } from './utils'
