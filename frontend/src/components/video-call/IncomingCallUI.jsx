import PropTypes from 'prop-types'

const IncomingCallUI = ({ caller, onAccept, onReject }) => {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="p-6">
          <div className="mb-4 flex items-center">
            <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <span className="text-2xl font-bold text-blue-600">
                {caller?.callerName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {caller?.callerName || 'Unknown Caller'}
              </h3>
              <p className="text-sm text-gray-600">
                Incoming {caller?.type || 'video'} call...
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {/* Reject Button */}
            <button
              onClick={() => onReject()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path
                  fillRule="evenodd"
                  d="M15.22 3.22a.75.75 0 011.06 0L18 4.94l1.72-1.72a.75.75 0 111.06 1.06L19.06 6l1.72 1.72a.75.75 0 01-1.06 1.06L18 7.06l-1.72 1.72a.75.75 0 11-1.06-1.06L16.94 6l-1.72-1.72a.75.75 0 010-1.06zM1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Accept Button */}
            <button
              onClick={() => onAccept()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
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
        </div>
      </div>
    </div>
  )
}

IncomingCallUI.propTypes = {
  caller: PropTypes.shape({
    callerId: PropTypes.string,
    callerName: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
}

export default IncomingCallUI
