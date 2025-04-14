import { getSocket } from './index'
let socketRef = null

export const disconnectSocket = () => {
  socketRef = getSocket()
  if (socketRef) {
    console.log('Explicitly disconnecting socket with ID:', socketRef.id)
    try {
      socketRef.removeAllListeners()
      socketRef.disconnect()
      socketRef = null
      console.log('Socket disconnected and nullified successfully')
    } catch (error) {
      console.error('Error disconnecting socket:', error)
    }
  } else {
    console.log('No socket to disconnect')
  }
}
