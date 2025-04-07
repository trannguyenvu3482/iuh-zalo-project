import { Menu } from '@headlessui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import { useMemo } from 'react'
import { getFriendRequests, respondToRequest } from '../api/apiFriends'
import { useSocket } from '../contexts/SocketContext'

const FriendRequestsMenu = () => {
  const { friendRequests, clearFriendRequest, respondToFriendRequest } =
    useSocket()
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  // Fetch friend requests
  const { data: apiRequests = [] } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: getFriendRequests,
    staleTime: 30000, // 30 seconds
  })

  // Respond to friend request mutation
  const { mutate } = useMutation({
    mutationFn: respondToRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
    onError: (error) => {
      enqueueSnackbar(`Error responding to request: ${error.message}`, {
        variant: 'error',
      })
    },
  })

  // Combine API requests with socket requests
  const localRequests = useMemo(() => {
    return [
      ...apiRequests,
      ...friendRequests.filter(
        (req) => !apiRequests.some((apiReq) => apiReq.id === req.id),
      ),
    ]
  }, [apiRequests, friendRequests])

  // Handle responding to request
  const handleResponse = (requestId, status) => {
    // Send response via socket
    respondToFriendRequest(requestId, status)

    // Send response via API
    mutate({ requestId, status })

    // Clear from local state
    clearFriendRequest(requestId)

    // Show notification
    enqueueSnackbar(`Friend request ${status}`, {
      variant: status === 'accepted' ? 'success' : 'info',
    })
  }

  const requestCount = localRequests.length

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative rounded-full p-1 text-gray-700 hover:bg-gray-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 w-6"
        >
          <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
        </svg>

        {requestCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {requestCount}
          </span>
        )}
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="px-4 py-3">
          <p className="text-sm font-medium">Friend Requests</p>
        </div>

        <div className="max-h-96 overflow-y-auto py-1">
          {localRequests.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              No friend requests
            </div>
          ) : (
            localRequests.map((request) => (
              <div key={request.id} className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <img
                    src={
                      request.senderAvatar ||
                      'https://avatar.iran.liara.run/public/44'
                    }
                    alt={request.senderName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{request.senderName}</p>
                    <p className="text-xs text-gray-500">
                      {request.message || 'Wants to be your friend'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleResponse(request.id, 'accepted')}
                      className="rounded bg-primary-blue px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleResponse(request.id, 'rejected')}
                      className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-300"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Menu.Items>
    </Menu>
  )
}

export default FriendRequestsMenu
