import PropTypes from 'prop-types'
import React, { createContext, useCallback, useContext, useState } from 'react'

const AgoraContext = createContext()

export const AgoraProvider = ({ children }) => {
  const [incomingCall, setIncomingCall] = useState(null)
  const [ongoingCall, setOngoingCall] = useState(null)
  const [callStatus, setCallStatus] = useState('idle') // idle, calling, ringing, connected, ended

  // Handle incoming call
  const handleIncomingCall = useCallback((call) => {
    setIncomingCall(call)
    setCallStatus('ringing')
  }, [])

  // Accept a call
  const acceptCall = useCallback(() => {
    if (!incomingCall) return

    setOngoingCall(incomingCall)
    setIncomingCall(null)
    setCallStatus('connected')

    // Here you would connect to Agora channel
  }, [incomingCall])

  // Reject a call
  const rejectCall = useCallback(() => {
    setIncomingCall(null)
    setCallStatus('idle')
  }, [])

  // End an ongoing call
  const endCall = useCallback(() => {
    setOngoingCall(null)
    setCallStatus('idle')

    // Here you would disconnect from Agora channel
  }, [])

  // Start a new call
  const startCall = useCallback((user, isVideo = true) => {
    setOngoingCall({
      recipient: user,
      isVideo,
      startTime: new Date(),
    })
    setCallStatus('calling')

    // Here you would initiate a call via socket
  }, [])

  const value = {
    incomingCall,
    ongoingCall,
    callStatus,
    handleIncomingCall,
    acceptCall,
    rejectCall,
    endCall,
    startCall,
  }

  return <AgoraContext.Provider value={value}>{children}</AgoraContext.Provider>
}

AgoraProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export const useAgora = () => {
  const context = useContext(AgoraContext)
  if (!context) {
    throw new Error('useAgora must be used within an AgoraProvider')
  }
  return context
}

export default AgoraContext
