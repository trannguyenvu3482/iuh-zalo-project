import AgoraRTC, { AgoraRTCProvider } from 'agora-rtc-react'

import PropTypes from 'prop-types'
import VideoCall from './VideoCall'

const VideoCalling = ({
  channelName,
  token,
  onCallEnd,
  remoteUser,
  appId: propAppId,
}) => {
  // Create an Agora client with correct mode and codec
  const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })

  // Get the app ID from props or environment variables
  const appId = propAppId || import.meta.env.VITE_AGORA_APP_ID || ''

  // Log the Agora App ID (first 3 chars only for security)
  if (!appId) {
    console.error(
      'No Agora App ID found! Please check your environment variables.',
    )
  } else {
    console.log(
      `Using Agora App ID: ${appId.substring(0, 3)}...${appId.length} chars`,
    )
  }

  console.log('VideoCalling rendering with props:', {
    channelName,
    hasToken: !!token,
    remoteUser,
    hasAppId: !!appId,
    usingCustomAppId: !!propAppId,
  })

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <AgoraRTCProvider client={client}>
        <VideoCall
          appId={appId}
          channelName={channelName}
          token={token}
          onCallEnd={onCallEnd}
          remoteUser={remoteUser}
        />
      </AgoraRTCProvider>
    </div>
  )
}

VideoCalling.propTypes = {
  channelName: PropTypes.string.isRequired,
  token: PropTypes.string,
  onCallEnd: PropTypes.func.isRequired,
  remoteUser: PropTypes.shape({
    id: PropTypes.string,
    fullName: PropTypes.string,
  }),
  appId: PropTypes.string,
}

export default VideoCalling
