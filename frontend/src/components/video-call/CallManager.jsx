import React from 'react'
import { useAgora } from './AgoraContext'
import IncomingCallUI from './IncomingCallUI'
import VideoCallUI from './VideoCallUI'

const CallManager = () => {
  const { incomingCall, ongoingCall, callStatus } = useAgora()

  // No call to handle
  if (callStatus === 'idle') {
    return null
  }

  // Incoming call UI
  if (callStatus === 'ringing' && incomingCall) {
    return <IncomingCallUI caller={incomingCall} />
  }

  // Ongoing call UI (outgoing or connected)
  if (callStatus === 'calling' || callStatus === 'connected') {
    const remoteUser = ongoingCall?.recipient || incomingCall
    return <VideoCallUI remoteUser={remoteUser} />
  }

  return null
}

export default CallManager
