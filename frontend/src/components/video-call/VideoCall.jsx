import AgoraRTC, {
  LocalUser,
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteAudioTracks,
  useRemoteUsers,
} from 'agora-rtc-react'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaVideo,
  FaVideoSlash,
} from 'react-icons/fa'
import { HiRefresh } from 'react-icons/hi'
import { IoIosPeople } from 'react-icons/io'
import { useUserStore } from '../../zustand/userStore'

const VideoCall = ({ appId, channelName, token, onCallEnd, remoteUser }) => {
  const [calling, setCalling] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [error, setError] = useState(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const { user } = useUserStore()

  console.log('VideoCall rendering with props:', {
    appId,
    channelName,
    hasToken: !!token,
    remoteUser,
    currentUser: user?.id,
  })

  // Check connection status
  const isConnected = useIsConnected()

  // Extract role from URL to determine if caller or callee
  const urlParams = new URLSearchParams(window.location.search)
  const callerId = urlParams.get('callerId')
  const isCallee = user?.id !== callerId
  const uid = isCallee ? 5678 : 1234

  // Show in console the exact UID being used
  useEffect(() => {
    console.log(
      `Using Agora UID: ${uid} (${isCallee ? 'callee' : 'caller'}) for user ${user?.id} in channel: ${channelName}`,
    )
  }, [uid, isCallee, channelName, user?.id])

  // Join the channel with the fixed UID
  const { isLoading: isJoining, isSuccess: joinSuccess } = useJoin(
    {
      appid: appId,
      channel: channelName,
      token: token || null,
      uid: uid, // Use the fixed UID based on role
    },
    calling && !!channelName, // Only join if we have a channel name
  )

  // Initialize local tracks
  const { localMicrophoneTrack, isLoading: isMicLoading } =
    useLocalMicrophoneTrack(micOn)
  const { localCameraTrack, isLoading: isCameraLoading } =
    useLocalCameraTrack(cameraOn)

  // Publish local tracks to the channel
  const { isLoading: isPublishing, isSuccess: publishSuccess } = usePublish(
    [localMicrophoneTrack, localCameraTrack].filter(Boolean),
  )

  // Log publishing status
  useEffect(() => {
    console.log('Track publishing status:', {
      isPublishing,
      publishSuccess,
      micReady: !!localMicrophoneTrack && !isMicLoading,
      cameraReady: !!localCameraTrack && !isCameraLoading,
      micTrackId: localMicrophoneTrack?.getTrackId?.(),
      cameraTrackId: localCameraTrack?.getTrackId?.(),
    })

    if (publishSuccess) {
      console.log('🎉 Successfully published tracks to Agora!')
    }
  }, [
    isPublishing,
    publishSuccess,
    localMicrophoneTrack,
    localCameraTrack,
    isMicLoading,
    isCameraLoading,
  ])

  // Get remote users
  const remoteUsers = useRemoteUsers()
  const { audioTracks } = useRemoteAudioTracks(remoteUsers)

  // Check if client has detected remote users but the hook hasn't updated yet
  useEffect(() => {
    if (isConnected && remoteUsers.length === 0) {
      try {
        // Access the client directly through the AgoraRTC global
        const clientInstance = AgoraRTC.client
        if (
          clientInstance &&
          typeof clientInstance.getRemoteUsers === 'function'
        ) {
          const directRemoteUsers = clientInstance.getRemoteUsers()
          if (directRemoteUsers && directRemoteUsers.length > 0) {
            console.log(
              'Found remote users directly from client:',
              directRemoteUsers,
            )

            // Try to manually subscribe to the remote user's streams
            directRemoteUsers.forEach((user) => {
              console.log('Manually subscribing to remote user:', user.uid)
              clientInstance
                .subscribe(user, ['audio', 'video'])
                .then(() => {
                  console.log('Manual subscription successful for:', user.uid)
                })
                .catch((err) => {
                  console.error('Manual subscription failed:', err)
                })
            })
          }
        }
      } catch (err) {
        console.error('Error checking for direct remote users:', err)
      }
    }
  }, [isConnected, remoteUsers.length])

  // Retry connection if no remote users after a timeout
  useEffect(() => {
    if (isConnected && remoteUsers.length === 0 && connectionAttempts < 5) {
      const timer = setTimeout(() => {
        console.log(
          `No remote users found after ${(connectionAttempts + 1) * 2} seconds, retrying... (attempt ${connectionAttempts + 1}/5)`,
        )
        setConnectionAttempts((prev) => prev + 1)
        setCalling(false)
        // Force an Agora reconnection
        setTimeout(() => setCalling(true), 300)
      }, 2000) // Try more frequently (every 2 seconds)

      return () => clearTimeout(timer)
    }
  }, [isConnected, remoteUsers.length, connectionAttempts])

  // Add a function to force refresh the connection
  const forceRefresh = () => {
    console.log('Forcing connection refresh')
    setConnectionAttempts(0)
    setCalling(false)

    // Force a complete disconnect and reconnect
    setTimeout(() => {
      console.log('Reconnecting after forced refresh')
      setCalling(true)
    }, 300)
  }

  // Force initial connection attempt on mount
  useEffect(() => {
    // Small delay to let other things initialize
    const timer = setTimeout(() => {
      console.log('Initial connection attempt')
      forceRefresh()
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Log connection and track status
  useEffect(() => {
    console.log('Agora connection status:', {
      isConnected: isConnected ? 'Connected' : 'Disconnected',
      isJoining,
      joinSuccess,
      channelName,
      userId: user?.id,
      attempts: connectionAttempts,
    })
  }, [
    isConnected,
    isJoining,
    joinSuccess,
    channelName,
    user?.id,
    connectionAttempts,
  ])

  useEffect(() => {
    if (remoteUsers.length > 0) {
      console.log(
        'Remote users connected:',
        remoteUsers.map((user) => ({
          uid: user.uid,
          hasAudio: audioTracks.some((track) => track.getUserId() === user.uid),
          hasVideo: user.hasVideo,
        })),
      )
    }
  }, [remoteUsers, audioTracks])

  useEffect(() => {
    console.log('Local tracks status:', {
      microphone: isMicLoading
        ? 'Loading'
        : localMicrophoneTrack
          ? 'Loaded'
          : 'Not available',
      camera: isCameraLoading
        ? 'Loading'
        : localCameraTrack
          ? 'Loaded'
          : 'Not available',
      publishing: isPublishing ? 'In progress' : 'Complete',
    })
  }, [
    localMicrophoneTrack,
    localCameraTrack,
    isMicLoading,
    isCameraLoading,
    isPublishing,
  ])

  // Play remote audio tracks
  useEffect(() => {
    try {
      if (audioTracks.length > 0) {
        console.log(`Playing ${audioTracks.length} remote audio tracks`)
        audioTracks.forEach((track) => track.play())
      }
    } catch (err) {
      console.error('Error playing remote audio:', err)
      setError(`Error playing remote audio: ${err.message}`)
    }
  }, [audioTracks])

  // End call handler
  const handleEndCall = () => {
    setCalling(false)
    console.log('Ending call and cleaning up')
    setTimeout(() => {
      onCallEnd()
    }, 300)
  }

  if (error) {
    return (
      <div className="absolute left-0 right-0 top-0 z-50 bg-red-600 p-2 text-center text-white">
        {error}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Debugging info */}
      <div className="absolute left-0 right-0 top-0 z-50 bg-blue-600 p-2 text-center text-xs text-white">
        <div>
          Channel: <b>{channelName || 'none'}</b> | Remote users:{' '}
          <b>{remoteUsers.length}</b> | Role:{' '}
          <b>{isCallee ? 'Callee (5678)' : 'Caller (1234)'}</b> | Connected:{' '}
          <b>{isConnected ? 'Yes' : 'No'}</b> | Attempt:{' '}
          <b>{connectionAttempts}/5</b>
        </div>
        <div className="mt-1">
          Mic:{' '}
          <b
            className={
              isMicLoading
                ? 'text-yellow-300'
                : micOn
                  ? 'text-green-300'
                  : 'text-red-300'
            }
          >
            {isMicLoading ? 'Loading' : micOn ? 'On' : 'Off'}
          </b>{' '}
          | Camera:{' '}
          <b
            className={
              isCameraLoading
                ? 'text-yellow-300'
                : cameraOn
                  ? 'text-green-300'
                  : 'text-red-300'
            }
          >
            {isCameraLoading ? 'Loading' : cameraOn ? 'On' : 'Off'}
          </b>{' '}
          | Publishing:{' '}
          <b
            className={
              isPublishing
                ? 'text-yellow-300'
                : publishSuccess
                  ? 'text-green-300'
                  : 'text-gray-300'
            }
          >
            {isPublishing
              ? 'In Progress'
              : publishSuccess
                ? 'Success'
                : 'Waiting'}
          </b>
        </div>
        {remoteUsers.length > 0 ? (
          <div className="mt-1 text-green-300">
            Connected to: {remoteUsers.map((u) => u.uid).join(', ')} (has video:{' '}
            {remoteUsers.some((u) => u.hasVideo) ? 'Yes' : 'No'})
          </div>
        ) : (
          <div className="mt-1 text-yellow-300">
            Waiting for partner to connect{' '}
            {publishSuccess
              ? '(Your camera is being shared)'
              : '(Publishing in progress...)'}
          </div>
        )}
        <div className="mt-1 flex justify-center space-x-2">
          <button
            onClick={forceRefresh}
            className="flex items-center rounded bg-green-600 px-2 py-1 font-bold"
          >
            <HiRefresh className="mr-1 h-4 w-4" /> Force Reconnect
          </button>
          <button
            onClick={() => {
              setConnectionAttempts(0)
              const clientInstance = AgoraRTC.client
              if (
                clientInstance &&
                typeof clientInstance.getRemoteUsers === 'function'
              ) {
                const directRemoteUsers = clientInstance.getRemoteUsers()
                console.log('Manual check for remote users:', directRemoteUsers)
                if (directRemoteUsers && directRemoteUsers.length > 0) {
                  alert(`Found ${directRemoteUsers.length} remote users!`)
                } else {
                  alert('No remote users found')
                }
              }
            }}
            className="flex items-center rounded bg-blue-800 px-2 py-1"
          >
            <IoIosPeople className="mr-1 h-4 w-4" /> Check Users
          </button>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 bg-gray-900 p-4 pt-28">
        <div className="grid h-full w-full grid-cols-1 gap-4 md:grid-cols-2">
          {/* Remote users */}
          {remoteUsers.length > 0 ? (
            remoteUsers.map((user) => (
              <div
                key={user.uid}
                className="relative h-full w-full overflow-hidden rounded-lg bg-gray-800"
              >
                <RemoteUser
                  user={user}
                  cover="https://via.placeholder.com/640x360.png?text=User"
                  className="h-full w-full object-cover"
                >
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm text-white">
                    {remoteUser?.fullName || user.uid}
                  </div>
                </RemoteUser>
              </div>
            ))
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-800 text-white">
              Waiting for {remoteUser?.fullName || 'remote user'} to join...
            </div>
          )}

          {/* Local user */}
          <div className="relative h-full w-full overflow-hidden rounded-lg bg-gray-800">
            <LocalUser
              audioTrack={localMicrophoneTrack}
              videoTrack={localCameraTrack}
              cameraOn={cameraOn}
              micOn={micOn}
              cover="https://via.placeholder.com/640x360.png?text=You"
              className="h-full w-full object-cover"
            >
              <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm text-white">
                You
              </div>
            </LocalUser>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4 bg-gray-800 p-4">
        <button
          onClick={() => setMicOn(!micOn)}
          className={`rounded-full p-3 ${micOn ? 'bg-gray-600' : 'bg-red-600'} transition-opacity hover:opacity-90`}
          title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micOn ? (
            <FaMicrophone className="h-6 w-6 text-white" />
          ) : (
            <FaMicrophoneSlash className="h-6 w-6 text-white" />
          )}
        </button>

        <button
          onClick={() => setCameraOn(!cameraOn)}
          className={`rounded-full p-3 ${cameraOn ? 'bg-gray-600' : 'bg-red-600'} transition-opacity hover:opacity-90`}
          title={cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {cameraOn ? (
            <FaVideo className="h-6 w-6 text-white" />
          ) : (
            <FaVideoSlash className="h-6 w-6 text-white" />
          )}
        </button>

        <button
          onClick={handleEndCall}
          className="rounded-full bg-red-600 p-3 transition-colors hover:bg-red-700"
          title="End Call"
        >
          <FaPhoneSlash className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  )
}

VideoCall.propTypes = {
  appId: PropTypes.string.isRequired,
  channelName: PropTypes.string.isRequired,
  token: PropTypes.string,
  onCallEnd: PropTypes.func.isRequired,
  remoteUser: PropTypes.shape({
    id: PropTypes.string,
    fullName: PropTypes.string,
  }),
}

export default VideoCall
