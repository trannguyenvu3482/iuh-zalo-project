import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'
import { useAgora } from './AgoraContext'

const AgoraVideoCall = ({ channelName, token, uid, role }) => {
  const { client, ready, tracks } = useAgora()
  const [users, setUsers] = useState([])
  const [start, setStart] = useState(false)
  const localVideoRef = useRef(null)
  const remoteVideoRefs = useRef({})

  // Initialize the SDK
  useEffect(() => {
    // Initialize the client
    const init = async () => {
      try {
        if (!ready) return

        // Add event listeners to the client
        client.on('user-published', handleUserPublished)
        client.on('user-unpublished', handleUserUnpublished)

        // Join the channel
        await client.join(
          process.env.REACT_APP_AGORA_APP_ID,
          channelName,
          token,
          uid,
        )

        // Create local audio and video tracks
        if (tracks) {
          // Publish the local tracks
          await client.publish(tracks)

          // Play local video track
          tracks[1].play(localVideoRef.current)
        }

        setStart(true)
      } catch (error) {
        console.error('Error initializing Agora client:', error)
      }
    }

    init()

    // Cleanup
    return () => {
      if (client) {
        client.removeAllListeners()
        client.leave()
      }

      if (tracks) {
        tracks.forEach((track) => track.close())
      }
    }
  }, [client, channelName, ready, token, tracks, uid])

  // Handle remote user published
  const handleUserPublished = async (user, mediaType) => {
    await client.subscribe(user, mediaType)

    if (mediaType === 'video') {
      // Add user to list of users
      setUsers((prevUsers) => {
        if (!prevUsers.includes(user)) {
          return [...prevUsers, user]
        }
        return prevUsers
      })

      // Play the remote video
      setTimeout(() => {
        if (remoteVideoRefs.current[user.uid]) {
          user.videoTrack.play(remoteVideoRefs.current[user.uid])
        }
      }, 500)
    }

    if (mediaType === 'audio') {
      // Play the remote audio
      user.audioTrack.play()
    }
  }

  // Handle remote user unpublished
  const handleUserUnpublished = (user, mediaType) => {
    if (mediaType === 'audio') {
      if (user.audioTrack) user.audioTrack.stop()
    }

    if (mediaType === 'video') {
      if (user.videoTrack) user.videoTrack.stop()

      // Remove user from list of users
      setUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid))
    }
  }

  // Mute audio
  const muteAudio = async (muted) => {
    if (tracks && tracks[0]) {
      await tracks[0].setMuted(muted)
    }
  }

  // Mute video
  const muteVideo = async (muted) => {
    if (tracks && tracks[1]) {
      await tracks[1].setMuted(muted)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 bg-gray-900">
        {/* Remote videos (grid layout) */}
        <div
          className={`grid ${users.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} h-full gap-2`}
        >
          {users.map((user) => (
            <div
              key={user.uid}
              className="relative overflow-hidden rounded bg-gray-800"
            >
              <div
                ref={(el) => (remoteVideoRefs.current[user.uid] = el)}
                className="h-full w-full"
              ></div>
              <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                User {user.uid}
              </div>
            </div>
          ))}

          {/* If no remote users or still connecting */}
          {users.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-white">
                {start ? 'Waiting for others to join...' : 'Connecting...'}
              </div>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-20 right-4 aspect-video w-1/4 max-w-[180px] overflow-hidden rounded-lg border-2 border-white">
          <div ref={localVideoRef} className="h-full w-full bg-gray-800"></div>
          <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
            You
          </div>
        </div>

        {/* Call controls would go here */}
      </div>
    </div>
  )
}

AgoraVideoCall.propTypes = {
  channelName: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  uid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  role: PropTypes.oneOf(['host', 'audience']),
}

AgoraVideoCall.defaultProps = {
  role: 'host',
}

export default AgoraVideoCall
