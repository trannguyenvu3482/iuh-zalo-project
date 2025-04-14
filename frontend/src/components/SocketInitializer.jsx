import { useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { disconnectSocket } from '../service/socket/utils'
import { useUserStore } from '../zustand/userStore'

/**
 * Component to initialize socket connection when user authenticates
 * This is meant to be included once at the app level
 */
const SocketInitializer = () => {
  const { isAuthenticated, user } = useUserStore()
  const { initializeSocket, isConnected } = useSocket()

  // Initialize socket when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!isConnected) {
        initializeSocket()
      }
    } else {
      disconnectSocket()
    }
  }, [isAuthenticated, user, isConnected, initializeSocket])

  // No visible UI
  return null
}

export default SocketInitializer
