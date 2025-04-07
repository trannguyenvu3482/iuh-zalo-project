import PropTypes from 'prop-types'
import React from 'react'
import { useAgora } from './AgoraContext'

const IncomingCallUI = ({ caller }) => {
  const { acceptCall, rejectCall } = useAgora()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="bg-gray-50 p-6">
          <h3 className="mb-1 text-center text-xl font-semibold">
            Incoming Call
          </h3>
          <p className="mb-6 text-center text-gray-500">
            {caller?.type === 'video' ? 'Video Call' : 'Audio Call'}
          </p>

          <div className="flex flex-col items-center">
            {caller?.avatar ? (
              <img
                src={caller.avatar}
                alt={caller.fullname || 'Caller'}
                className="mb-4 h-24 w-24 rounded-full border-4 border-primary-blue object-cover"
              />
            ) : (
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-blue text-3xl font-bold text-white">
                {caller?.fullname?.[0] || '?'}
              </div>
            )}

            <h4 className="text-lg font-medium">
              {caller?.fullname || 'Unknown'}
            </h4>
            <p className="text-sm text-gray-500">is calling you...</p>
          </div>
        </div>

        <div className="flex border-t border-gray-200">
          <button
            onClick={rejectCall}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-3 font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
            Decline
          </button>

          <button
            onClick={acceptCall}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-3 font-medium text-green-600 transition-colors hover:bg-green-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                clipRule="evenodd"
              />
            </svg>
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

IncomingCallUI.propTypes = {
  caller: PropTypes.shape({
    id: PropTypes.string,
    fullname: PropTypes.string,
    avatar: PropTypes.string,
    type: PropTypes.oneOf(['audio', 'video']),
  }),
}

export default IncomingCallUI
