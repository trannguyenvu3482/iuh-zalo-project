import { createClient, createMicrophoneAndCameraTracks } from 'agora-rtc-react'
import { useSnackbar } from 'notistack'
import PropTypes from 'prop-types'
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useAuth } from './AuthContext'
import { useSocket } from './SocketContext'

// Create a context for the Agora client
const AgoraContext = createContext(null)

// Your Agora App ID (replace with your actual App ID from Agora console)
const appId = '0ebb848c75944876989f1e816f3641fc'

// Configuration for creating the Agora client
const config = {
  mode: 'rtc',
  codec: 'vp8',
}

// Create Agora client
const useClient = createClient(config)

// Create hooks for audio and video tracks
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks()

export const AgoraProvider = ({ children }) => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const { enqueueSnackbar } = useSnackbar()

  // Create Agora client
  const client = useClient()

  // State variables
  const [incomingCall, setIncomingCall] = useState(null)
  const [currentCall, setCurrentCall] = useState(null)
  const [localTracks, setLocalTracks] = useState([])
  const [users, setUsers] = useState([])
  const [start, setStart] = useState(false)
  const [callStatus, setCallStatus] = useState('idle') // idle, calling, ringing, connected, ended
  const timeoutRef = useRef(null)

  // Request and create tracks when needed
  const { ready, tracks } = useMicrophoneAndCameraTracks()

  // Initialize socket listeners for call events
  useEffect(() => {
    if (!socket || !user) return

    // Handle incoming call
    const handleIncomingCall = (data) => {
      console.log('Incoming call:', data)
      // Only accept calls if not already in a call
      if (!currentCall) {
        setIncomingCall(data)
        setCallStatus('ringing')
        // Auto-reject call after 30 seconds if not answered
        timeoutRef.current = setTimeout(() => {
          if (incomingCall) {
            handleRejectCall()
          }
        }, 30000)
      } else {
        // Automatically reject if already in a call
        socket.emit('call:reject', {
          callerId: data.callerId,
          calleeId: user.id,
          reason: 'busy',
        })
      }
    }

    // Handle call accepted
    const handleCallAccepted = (data) => {
      console.log('Call accepted:', data)
      setCallStatus('connected')
      // Join the call room
      joinCall(data.channelName, data.token)
    }

    // Handle call rejected
    const handleCallRejected = (data) => {
      console.log('Call rejected:', data)
      enqueueSnackbar(
        `Call was rejected: ${data.reason || 'User unavailable'}`,
        {
          variant: 'info',
        },
      )
      setCurrentCall(null)
      setCallStatus('idle')
    }

    // Handle call ended
    const handleCallEnded = (data) => {
      console.log('Call ended:', data)
      leaveCall()
      enqueueSnackbar('Call has ended', { variant: 'info' })
    }

    // Register socket event listeners
    socket.on('call:incoming', handleIncomingCall)
    socket.on('call:accepted', handleCallAccepted)
    socket.on('call:rejected', handleCallRejected)
    socket.on('call:ended', handleCallEnded)

    // Cleanup event listeners
    return () => {
      socket.off('call:incoming', handleIncomingCall)
      socket.off('call:accepted', handleCallAccepted)
      socket.off('call:rejected', handleCallRejected)
      socket.off('call:ended', handleCallEnded)

      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [socket, user, currentCall, incomingCall, enqueueSnackbar])

  // Cleanup tracks when component unmounts
  useEffect(() => {
    return () => {
      if (localTracks.length > 0) {
        localTracks.forEach((track) => {
          track.close()
        })
      }
    }
  }, [localTracks])

  // Join a call with channel name and token
  const joinCall = async (channelName, token) => {
    try {
      if (!ready) {
        console.log('Tracks not ready')
        return
      }

      console.log('Joining channel:', channelName)
      client.on('user-published', handleUserPublished)
      client.on('user-unpublished', handleUserUnpublished)

      // Join the channel
      await client.join(appId, channelName, token, user.id)

      // Publish local tracks
      await client.publish(tracks)
      setLocalTracks(tracks)

      setStart(true)
      setUsers((prevUsers) => {
        return [...prevUsers]
      })
    } catch (error) {
      console.error('Error joining call:', error)
      enqueueSnackbar('Failed to join call. Please try again.', {
        variant: 'error',
      })
    }
  }

  // Leave the current call
  const leaveCall = async () => {
    try {
      // Close and release tracks
      if (localTracks.length > 0) {
        localTracks.forEach((track) => {
          track.close()
        })
      }

      // Leave the channel
      await client.leave()
      client.removeAllListeners()

      // Reset state
      setUsers([])
      setStart(false)
      setCurrentCall(null)
      setIncomingCall(null)
      setCallStatus('idle')

      // Notify through socket
      if (currentCall) {
        socket.emit('call:end', {
          callerId: currentCall.callerId,
          calleeId: currentCall.calleeId,
          channelName: currentCall.channelName,
        })
      }
    } catch (error) {
      console.error('Error leaving call:', error)
    }
  }

  // Handle when remote user publishes audio/video
  const handleUserPublished = async (user, mediaType) => {
    await client.subscribe(user, mediaType)

    if (mediaType === 'video') {
      setUsers((prevUsers) => {
        if (!prevUsers.find((u) => u.uid === user.uid)) {
          return [...prevUsers, user]
        }
        return prevUsers
      })
    }

    if (mediaType === 'audio') {
      user.audioTrack?.play()
    }
  }

  // Handle when remote user unpublishes audio/video
  const handleUserUnpublished = (user, mediaType) => {
    if (mediaType === 'audio') {
      user.audioTrack?.stop()
    }

    if (mediaType === 'video') {
      setUsers((prevUsers) => {
        return prevUsers.filter((u) => u.uid !== user.uid)
      })
    }
  }

  // Initiate a call to another user
  const initiateCall = async (calleeId, isVideo = true) => {
    try {
      if (!socket || !user) return

      setCallStatus('calling')
      const callData = {
        callerId: user.id,
        callerName: user.fullname,
        calleeId,
        type: isVideo ? 'video' : 'audio',
        timestamp: new Date().toISOString(),
      }

      setCurrentCall(callData)
      socket.emit('call:initiate', callData)

      // Auto-cancel call after 30 seconds if not answered
      timeoutRef.current = setTimeout(() => {
        if (callStatus === 'calling') {
          enqueueSnackbar('Call not answered', { variant: 'info' })
          leaveCall()
        }
      }, 30000)
    } catch (error) {
      console.error('Error initiating call:', error)
      enqueueSnackbar('Failed to initiate call. Please try again.', {
        variant: 'error',
      })
    }
  }

  // Accept an incoming call
  const acceptCall = () => {
    if (!incomingCall || !socket || !user) return

    // Clear timeout for auto-reject
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setCurrentCall(incomingCall)
    setCallStatus('connecting')

    socket.emit('call:accept', {
      callerId: incomingCall.callerId,
      calleeId: user.id,
    })
  }

  // Reject an incoming call
  const handleRejectCall = (reason = 'rejected') => {
    if (!incomingCall || !socket || !user) return

    // Clear timeout for auto-reject
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    socket.emit('call:reject', {
      callerId: incomingCall.callerId,
      calleeId: user.id,
      reason,
    })

    setIncomingCall(null)
  }

  // Toggle audio mute state
  const toggleAudio = async (muted) => {
    if (localTracks.length > 0 && localTracks[0]) {
      await localTracks[0].setMuted(muted)
      return !muted
    }
    return false
  }

  // Toggle video enabled state
  const toggleVideo = async (enabled) => {
    if (localTracks.length > 1 && localTracks[1]) {
      await localTracks[1].setMuted(enabled)
      return !enabled
    }
    return false
  }

  const value = {
    client,
    ready,
    tracks,
    users,
    start,
    incomingCall,
    currentCall,
    callStatus,
    localTracks,
    initiateCall,
    acceptCall,
    rejectCall: handleRejectCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
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
