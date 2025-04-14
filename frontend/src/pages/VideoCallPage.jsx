import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
import { HiX } from 'react-icons/hi'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import VideoCalling from '../components/video-call/VideoCalling'
import { useSocket } from '../contexts/SocketContext'
import * as socketService from '../service/socket'
import { getAgoraToken } from '../service/tokenService'
import { endCurrentCall } from '../utils/callUtils'
import { useUserStore } from '../zustand/userStore'

const VideoCallPage = () => {
  const { user } = useUserStore()
  const { socket } = useSocket()
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const location = useLocation()
  const { channelId } = useParams()

  // Get query parameters
  const queryParams = new URLSearchParams(location.search)
  const callType = queryParams.get('type') || 'video'
  const calleeId = queryParams.get('calleeId')
  const callerId = queryParams.get('callerId')
  const callerName = queryParams.get('callerName')

  // Get a direct reference to the socket
  const directSocket = socketService.getSocket()

  // Call state
  const [callState, setCallState] = useState(
    callerId ? 'receiving' : 'initiating',
  ) // initiating, receiving, connected, ended, rejected
  const [channelName, setChannelName] = useState(channelId || '')
  const [token, setToken] = useState(null)
  const [remoteUser, setRemoteUser] = useState(null)
  const [isLoadingToken, setIsLoadingToken] = useState(false)
  const [agoraAppId, setAgoraAppId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Check for existing call data in global state
  useEffect(() => {
    if (typeof window !== 'undefined' && window.callState?.currentCall) {
      console.log(
        'Found existing call data in global state:',
        window.callState.currentCall,
      )

      // If we have channel info from global state but not from URL, use it
      if (!channelId && window.callState.currentCall.channelName) {
        setChannelName(window.callState.currentCall.channelName)
      }
    }
  }, [channelId])

  // Fetch token from token server
  useEffect(() => {
    const fetchToken = async () => {
      if (!channelName) return

      try {
        setIsLoadingToken(true)
        // Get the appropriate UID based on whether we're caller or callee
        const uid = user?.id === callerId ? 1234 : 5678

        console.log(`Fetching token for channel ${channelName} with UID ${uid}`)

        // Call token server
        const tokenData = await getAgoraToken(channelName, uid)

        console.log('Token received:', {
          hasToken: !!tokenData.token,
          channel: tokenData.channel,
          appId: tokenData.appId?.substring(0, 3) + '...',
        })

        // Set the token
        setToken(tokenData.token)

        // Store the Agora App ID from the token response
        if (tokenData.appId) {
          setAgoraAppId(tokenData.appId)
        }
      } catch (error) {
        console.error('Failed to fetch Agora token:', error)
        enqueueSnackbar('Could not get call token. Please try again.', {
          variant: 'error',
        })
      } finally {
        setIsLoadingToken(false)
      }
    }

    fetchToken()
  }, [channelName, user?.id, callerId, enqueueSnackbar])

  // Initialize remote user info
  useEffect(() => {
    if (callerId && callerId !== user?.id) {
      setRemoteUser({
        id: callerId,
        fullName: callerName || 'Caller',
      })
    } else if (calleeId) {
      setRemoteUser({
        id: calleeId,
        fullName: 'Callee',
      })
    }
  }, [callerId, calleeId, callerName, user?.id])

  // Listen for custom window events
  useEffect(() => {
    // Handler for the custom call:accepted event
    const handleCustomCallAccepted = (event) => {
      console.log('Custom call:accepted event received in VideoCallPage', {
        detail: event.detail,
        currentCallState: callState,
        channelName,
        token,
      })

      // Update call state to connected
      setCallState('connected')

      // Update channel name and token if provided
      const data = event.detail
      if (data?.channelName) {
        console.log(
          `Updating channel name from ${channelName} to ${data.channelName}`,
        )
        setChannelName(data.channelName)
      }
      if (data?.token) {
        console.log('Updating token')
        setToken(data.token)
      }

      // Update remote user if available
      if (data?.calleeId && user?.id !== data.calleeId) {
        setRemoteUser((prevUser) => ({
          ...prevUser,
          id: data.calleeId,
          fullName: data.calleeName || prevUser?.fullName || 'Callee',
        }))
      } else if (data?.callerId && user?.id !== data.callerId) {
        setRemoteUser((prevUser) => ({
          ...prevUser,
          id: data.callerId,
          fullName: data.callerName || prevUser?.fullName || 'Caller',
        }))
      }
    }

    // Handler for the custom call:rejected event
    const handleCustomCallRejected = (event) => {
      console.log('Custom call:rejected event received in VideoCallPage', {
        detail: event.detail,
        currentCallState: callState,
        channelName,
      })

      // Only process if we're still in initiating state
      if (callState === 'initiating') {
        const data = event.detail

        // Update call state to rejected
        setCallState('rejected')

        // Store the rejection reason if available
        setRejectionReason(data.reason || 'User unavailable')

        // Show notification
        enqueueSnackbar(`Call rejected: ${data.reason || 'User unavailable'}`, {
          variant: 'info',
        })

        // Navigate away after a short delay to show the rejection screen
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.callState.currentCall = null
            window.callState.navigatingToCall = false
          }
          navigate('/')
        }, 3000)
      }
    }

    console.log('Setting up custom call event listeners in VideoCallPage')

    // Add event listeners
    window.addEventListener('call:accepted', handleCustomCallAccepted)
    window.addEventListener('call:rejected', handleCustomCallRejected)

    // Clean up
    return () => {
      console.log('Removing custom call event listeners from VideoCallPage')
      window.removeEventListener('call:accepted', handleCustomCallAccepted)
      window.removeEventListener('call:rejected', handleCustomCallRejected)
    }
  }, [callState, channelName, token, user?.id, enqueueSnackbar, navigate])

  // Handle socket connection
  useEffect(() => {
    const activeSocket = socket || directSocket

    if (!activeSocket || !user) {
      console.error('No socket or user available, cannot proceed with call')
      enqueueSnackbar('Could not connect to call service', { variant: 'error' })
      navigate('/')
      return
    }

    console.log('Video call page initialized with:', {
      channelId,
      callType,
      calleeId,
      callerId,
      callerName,
      socketConnected: activeSocket.connected,
      user: user?.id,
      callState,
    })

    // Set up event handlers for incoming call
    if (callState === 'initiating' && calleeId) {
      // We are initiating the call
      console.log('Initiating call to:', calleeId)

      const callData = {
        callerId: user.id,
        callerName: user.fullName || user.name || 'User',
        calleeId,
        type: callType,
        timestamp: new Date().toISOString(),
        channelName,
        token,
      }

      // Emit call initiation event
      activeSocket.emit('call:initiate', callData, (response) => {
        console.log('Call initiation response:', response)
        if (response?.error) {
          enqueueSnackbar(`Call failed: ${response.error}`, {
            variant: 'error',
          })
          navigate('/')
        }
      })

      // Set a timeout for call not answered
      const timeout = setTimeout(() => {
        if (callState === 'initiating') {
          enqueueSnackbar('Call not answered', { variant: 'info' })
          // Clear the global call state
          if (typeof window !== 'undefined') {
            window.callState.currentCall = null
            window.callState.navigatingToCall = false
          }
          navigate('/')
        }
      }, 30000) // 30 seconds timeout

      return () => clearTimeout(timeout)
    }

    // If we're receiving a call, no need to initiate
    // Just set up event handlers

    // Set up socket event handlers
    const handleCallAccepted = (data) => {
      console.log('Call was accepted:', data)

      // CRITICAL: Update call state to connected for both the caller and callee
      setCallState('connected')

      // Update channel and token if provided
      if (data.channelName) setChannelName(data.channelName)
      if (data.token) setToken(data.token)
    }

    const handleCallRejected = (data) => {
      console.log('Socket call:rejected event received:', data)

      // Make sure we're still in a state where rejection matters
      if (callState === 'initiating' || callState === 'receiving') {
        // Update call state to rejected
        setCallState('rejected')

        // Store the rejection reason if available
        setRejectionReason(data.reason || 'User unavailable')

        // Show a notification
        enqueueSnackbar(`Call rejected: ${data.reason || 'User unavailable'}`, {
          variant: 'info',
        })

        // Clear the global call state after a delay to show the rejection screen
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.callState.currentCall = null
            window.callState.navigatingToCall = false
          }
          navigate('/')
        }, 3000) // Show rejection screen for 3 seconds before navigating away
      } else {
        console.log(
          'Ignoring call rejection as call state is already:',
          callState,
        )
      }
    }

    const handleCallEnded = () => {
      console.log('Call ended by remote user')
      enqueueSnackbar('Call ended', { variant: 'info' })
      // Clear the global call state
      if (typeof window !== 'undefined') {
        window.callState.currentCall = null
        window.callState.navigatingToCall = false
      }
      navigate('/')
    }

    // Register event listeners
    activeSocket.on('call:accepted', handleCallAccepted)
    activeSocket.on('call:rejected', handleCallRejected)
    activeSocket.on('call:ended', handleCallEnded)

    // If we're receiving a call, accept it automatically since we're on the call page
    if (callState === 'receiving' && callerId && callerId !== user.id) {
      console.log(
        'Automatically accepting incoming call from:',
        callerId,
        'with channel name:',
        channelName,
      )

      // Include full user information when accepting the call
      const acceptData = {
        callerId,
        calleeId: user.id,
        calleeName: user?.fullName || user?.name || 'User',
        channelName,
        token,
        type: callType,
      }

      console.log('Sending call acceptance with data:', acceptData)

      activeSocket.emit('call:accept', acceptData)
      setCallState('connected')
    }

    return () => {
      // Clean up event listeners
      activeSocket.off('call:accepted', handleCallAccepted)
      activeSocket.off('call:rejected', handleCallRejected)
      activeSocket.off('call:ended', handleCallEnded)

      // End call when leaving the page
      if (callState === 'connected' || callState === 'initiating') {
        console.log('Ending call due to page navigation')
        activeSocket.emit('call:end', {
          callerId: user.id === callerId ? user.id : callerId || '',
          calleeId: user.id === calleeId ? user.id : calleeId || '',
          channelName,
        })

        // Clear the global call state
        if (typeof window !== 'undefined') {
          window.callState.currentCall = null
          window.callState.navigatingToCall = false
        }
      }
    }
  }, [
    socket,
    directSocket,
    user,
    navigate,
    enqueueSnackbar,
    channelId,
    callType,
    calleeId,
    callerId,
    callerName,
    callState,
    channelName,
    token,
  ])

  // Handle call end
  const handleEndCall = () => {
    const activeSocket = socket || directSocket

    if (activeSocket) {
      activeSocket.emit('call:end', {
        callerId: user.id === callerId ? user.id : callerId || '',
        calleeId: user.id === calleeId ? user.id : calleeId || '',
        channelName,
      })
    }

    // Use the utility function to end the call and navigate
    endCurrentCall()
  }

  // If call was rejected
  if (callState === 'rejected') {
    console.log('Rendering rejected state')
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900">
        <div className="mb-8 text-center text-white">
          <div className="mb-2 text-2xl">Call Rejected</div>
          <div className="text-gray-400">
            {rejectionReason || 'The person you called is unavailable'}
          </div>
          <div className="mt-4 text-gray-400">Returning to home...</div>
        </div>
      </div>
    )
  }

  // If we're waiting for a connection
  if (callState === 'initiating') {
    console.log('Rendering initiating state')
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900">
        <div className="mb-8 text-center text-white">
          <div className="mb-2 text-2xl">
            Calling {remoteUser?.fullName || 'User'}...
          </div>
          <div className="text-gray-400">
            Please wait while we connect your call
          </div>
        </div>

        <button
          onClick={handleEndCall}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
        >
          <HiX className="h-8 w-8" />
        </button>
      </div>
    )
  }

  // If we don't have a channelName yet, show loading
  if (!channelName) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white">
        <div className="mb-4 text-2xl">Waiting for channel name...</div>
        <div className="text-sm">Channel ID: {channelId || 'none'}</div>
      </div>
    )
  }

  // If we're fetching a token, show loading
  if (isLoadingToken) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white">
        <div className="mb-4 text-2xl">Fetching secure call token...</div>
        <div className="text-sm">Channel: {channelName}</div>
      </div>
    )
  }

  // If we don't have a token yet, show error
  if (!token && !isLoadingToken && channelName) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white">
        <div className="mb-4 text-2xl text-red-500">
          <HiX className="mr-2 inline-block h-6 w-6" />
          Could not get call token
        </div>
        <div className="mb-4">
          Please check your Agora credentials in the backend .env file
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Return Home
        </button>
      </div>
    )
  }

  return (
    <VideoCalling
      channelName={channelName}
      token={token}
      onCallEnd={handleEndCall}
      remoteUser={remoteUser}
      appId={agoraAppId}
    />
  )
}

export default VideoCallPage
