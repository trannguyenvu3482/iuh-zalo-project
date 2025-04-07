import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'
import { useAgora } from './AgoraContext'

// Controls for the video call
const CallControls = ({ onEndCall, isVideo }) => {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // Here you would call Agora's mute function
  }

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff)
    // Here you would call Agora's video toggle function
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent p-4">
      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className={`rounded-full p-3 ${
          isMuted ? 'bg-red-500' : 'bg-gray-700'
        } text-white`}
      >
        {isMuted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5zM6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5zM6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
          </svg>
        )}
      </button>

      {/* Video On/Off Button (only for video calls) */}
      {isVideo && (
        <button
          onClick={toggleVideo}
          className={`rounded-full p-3 ${
            isVideoOff ? 'bg-red-500' : 'bg-gray-700'
          } text-white`}
        >
          {isVideoOff ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.5 17.69c0 .471-.202.86-.504 1.124l-4.746-4.746V7.939l2.69-2.689c.944-.945 2.56-.276 2.56 1.06v11.38zM15.75 7.5v5.068L7.682 4.5h5.068a3 3 0 013 3zM1.5 7.5c0-.546.146-1.059.401-1.5l10.599 10.599v3.551a3 3 0 01-3 3H4.5a3 3 0 01-3-3v-9a3 3 0 013-3h.401L1.5 7.5z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
            </svg>
          )}
        </button>
      )}

      {/* End Call Button */}
      <button
        onClick={onEndCall}
        className="rounded-full bg-red-600 p-3 text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 w-6"
        >
          <path
            fillRule="evenodd"
            d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}

CallControls.propTypes = {
  onEndCall: PropTypes.func.isRequired,
  isVideo: PropTypes.bool,
}

CallControls.defaultProps = {
  isVideo: true,
}

// Call Timer Component
const CallTimer = () => {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = () => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="absolute left-1/2 top-4 -translate-x-1/2 transform rounded-full bg-black/40 px-3 py-1 text-sm text-white">
      {formatTime()}
    </div>
  )
}

// Main Video Call Component
const VideoCallUI = ({ remoteUser }) => {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const { callStatus, endCall } = useAgora()

  // Set up video streams
  useEffect(() => {
    // Here you would initialize Agora video streams
    // and attach them to the refs

    return () => {
      // Cleanup streams when component unmounts
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Remote video (full screen) */}
      <div className="relative flex-1 bg-gray-900">
        <div ref={remoteVideoRef} className="absolute inset-0">
          {/* If no remote video yet, show user info */}
          {callStatus === 'calling' && (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-700 text-3xl font-bold text-white">
                {remoteUser?.fullname?.[0] || '?'}
              </div>
              <h3 className="mb-2 text-xl text-white">
                {remoteUser?.fullname || 'Unknown'}
              </h3>
              <p className="text-gray-300">Calling...</p>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-20 right-4 aspect-video w-1/4 max-w-[180px] overflow-hidden rounded-lg border-2 border-white shadow-lg">
          <div ref={localVideoRef} className="h-full w-full bg-gray-800">
            {/* Placeholder for local video */}
          </div>
        </div>

        {/* Call timer */}
        {callStatus === 'connected' && <CallTimer />}

        {/* Call controls */}
        <CallControls onEndCall={endCall} isVideo={true} />
      </div>
    </div>
  )
}

VideoCallUI.propTypes = {
  remoteUser: PropTypes.shape({
    id: PropTypes.string,
    fullname: PropTypes.string,
    avatar: PropTypes.string,
  }),
}

export default VideoCallUI
