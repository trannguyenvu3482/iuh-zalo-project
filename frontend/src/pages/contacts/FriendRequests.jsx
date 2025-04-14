import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { FiChevronDown, FiChevronRight, FiUserPlus } from 'react-icons/fi'
import {
  cancelFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
  respondToRequest,
} from '../../api/apiFriends'
import { useSocket } from '../../contexts/SocketContext'
import socketService from '../../service/socket'

// Components
import Avatar from '../../components/Avatar'
import FriendRequestCard from '../../components/contacts/FriendRequestCard'
import LoadingSpinner from '../../components/LoadingSpinner'

// Collapsible section header component
const SectionHeader = ({ title, count, isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="group mb-4 flex w-full items-center justify-between"
  >
    <div className="flex items-center gap-2">
      <h2 className="text-base font-medium text-gray-700 group-hover:text-gray-900">
        {title} ({count})
      </h2>
      {isOpen ? (
        <FiChevronDown className="text-black" />
      ) : (
        <FiChevronRight className="text-black" />
      )}
    </div>
  </button>
)

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
}

const FriendRequests = () => {
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const socket = useSocket() // Get the socket context at component level
  const { friendRequests, clearFriendRequest, cancelFriendRequestSocket } =
    socket

  // Track section collapse state
  const [sectionsOpen, setSectionsOpen] = useState({
    received: true,
    sent: true,
    suggestions: true,
  })

  // Toggle section visibility
  const toggleSection = (section) => {
    setSectionsOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Fetch received friend requests
  const {
    data: receivedRequestsData,
    isLoading: isLoadingReceived,
    error: errorReceived,
    refetch: refetchReceivedRequests,
  } = useQuery({
    queryKey: ['receivedFriendRequests'],
    queryFn: getReceivedFriendRequests,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale
    cacheTime: 30000, // Cache for 30 seconds only
  })

  // Fetch sent friend requests
  const {
    data: sentRequestsData,
    isLoading: isLoadingSent,
    error: errorSent,
    refetch: refetchSentRequests,
  } = useQuery({
    queryKey: ['sentFriendRequests'],
    queryFn: getSentFriendRequests,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale
    cacheTime: 30000, // Cache for 30 seconds only
  })

  // Process requests data
  const receivedRequests = receivedRequestsData?.data || []
  const sentRequests = sentRequestsData?.data || []

  // Listen for socket events to refresh data
  useEffect(() => {
    // When we receive a new friend request via socket
    if (friendRequests.length > 0) {
      console.log('Received new friend request via socket:', friendRequests)

      // Force immediate refetch of received requests
      queryClient.fetchQuery({
        queryKey: ['receivedFriendRequests'],
        queryFn: getReceivedFriendRequests,
      })

      // Clear the socket notification since we're already in the friend requests view
      friendRequests.forEach((request) => {
        clearFriendRequest(request.id)
      })
    }
  }, [friendRequests, clearFriendRequest, queryClient])

  // Set up a separate effect to listen specifically for socket connection and events
  useEffect(() => {
    // Function to handle incoming friend requests
    const handleNewFriendRequest = (data) => {
      console.log('Socket event triggered: friend_request with data:', data)

      // Log the current query cache state
      console.log('Current received requests cache state:', {
        hasReceivedRequestsCache: !!queryClient.getQueryData([
          'receivedFriendRequests',
        ]),
        currentData: queryClient.getQueryData(['receivedFriendRequests']),
      })

      // Force immediate refetch of received requests
      queryClient
        .fetchQuery({
          queryKey: ['receivedFriendRequests'],
          queryFn: getReceivedFriendRequests,
        })
        .then((result) => {
          console.log('Fetched fresh received requests data:', result)
        })
        .catch((error) => {
          console.error('Error fetching received requests:', error)
        })
    }

    console.log(
      'Setting up friend_request socket listener in FriendRequests component',
    )

    // Get the raw socket directly from the imported socketService
    const rawSocket = socketService.getSocket()

    // Add a direct listener to verify events are received
    rawSocket.on('friend_request', (data) => {
      console.log('DIRECT SOCKET: Received friend_request event:', data)
    })

    // Set up event handler using the direct socketService
    const unsubscribe = socketService.onFriendRequest(handleNewFriendRequest)

    // Directly check if we're properly connected to socket
    console.log('Socket connection status:', {
      socketId: rawSocket.id,
      rooms: Array.from(rawSocket.rooms || []),
      connected: rawSocket.connected,
    })

    // Clean up
    return () => {
      console.log('Cleaning up friend_request socket listener')
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
      rawSocket.off('friend_request')
    }
  }, [queryClient])

  // Set up periodic polling for fresh data
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchReceivedRequests()
      refetchSentRequests()
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(intervalId)
  }, [refetchReceivedRequests, refetchSentRequests])

  // Accept friend request mutation
  const acceptMutation = useMutation({
    mutationFn: (requestId) =>
      respondToRequest({ requestId, status: 'accepted' }),
    onMutate: async (requestId) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries(['receivedFriendRequests'])

      // Snapshot the previous value
      const previousRequests = queryClient.getQueryData([
        'receivedFriendRequests',
      ])

      // Optimistically update the UI by removing the accepted request
      queryClient.setQueryData(['receivedFriendRequests'], (old) => {
        if (!old || !old.data) return old
        return {
          ...old,
          data: old.data.filter((request) => request.id !== requestId),
        }
      })

      // Return the snapshot for rollback if needed
      return { previousRequests }
    },
    onSuccess: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries(['receivedFriendRequests'])
      queryClient.invalidateQueries(['sentFriendRequests'])
      queryClient.invalidateQueries(['friends'])
      queryClient.invalidateQueries(['friendshipStatus'])

      enqueueSnackbar('Đã chấp nhận lời mời kết bạn', { variant: 'success' })
    },
    onError: (error, _, context) => {
      // If the mutation fails, roll back to the snapshot
      if (context?.previousRequests) {
        queryClient.setQueryData(
          ['receivedFriendRequests'],
          context.previousRequests,
        )
      }

      console.error('Error accepting friend request', error)
      enqueueSnackbar('Không thể chấp nhận lời mời', { variant: 'error' })
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(['receivedFriendRequests'])
    },
  })

  // Reject/Cancel friend request mutation
  const rejectMutation = useMutation({
    mutationFn: (requestData) => {
      const { requestId, type } = requestData
      // If this is a sent request, we should use cancelFriendRequest
      if (type === 'sent') {
        // Also emit a socket event for immediate notification
        cancelFriendRequestSocket(requestId)
        return cancelFriendRequest(requestId)
      } else {
        // Otherwise, use the reject endpoint
        return respondToRequest({ requestId, status: 'rejected' })
      }
    },
    onMutate: async (variables) => {
      const { requestId, type } = variables

      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      if (type === 'sent') {
        await queryClient.cancelQueries(['sentFriendRequests'])
      } else {
        await queryClient.cancelQueries(['receivedFriendRequests'])
      }

      // Snapshot the previous values
      const previousData =
        type === 'sent'
          ? queryClient.getQueryData(['sentFriendRequests'])
          : queryClient.getQueryData(['receivedFriendRequests'])

      // Optimistically update the UI
      if (type === 'sent') {
        queryClient.setQueryData(['sentFriendRequests'], (old) => {
          if (!old || !old.data) return old
          return {
            ...old,
            data: old.data.filter((request) => request.friend.id !== requestId),
          }
        })
      } else {
        queryClient.setQueryData(['receivedFriendRequests'], (old) => {
          if (!old || !old.data) return old
          return {
            ...old,
            data: old.data.filter((request) => request.id !== requestId),
          }
        })
      }

      // Return the snapshot for rollback if needed
      return { previousData, type }
    },
    onSuccess: (_, variables) => {
      const { type } = variables

      if (type === 'sent') {
        // Completely reset the cache for sent requests to force a clean state
        queryClient.removeQueries({ queryKey: ['sentFriendRequests'] })
        // Fetch fresh data immediately
        queryClient.fetchQuery({
          queryKey: ['sentFriendRequests'],
          queryFn: getSentFriendRequests,
        })

        enqueueSnackbar('Đã thu hồi lời mời kết bạn', { variant: 'info' })
      } else {
        enqueueSnackbar('Đã từ chối lời mời kết bạn', { variant: 'info' })
      }
    },
    onError: (error, variables, context) => {
      // If the mutation fails, roll back to the snapshot
      if (context?.previousData && context?.type) {
        const queryKey =
          context.type === 'sent'
            ? ['sentFriendRequests']
            : ['receivedFriendRequests']

        queryClient.setQueryData(queryKey, context.previousData)
      }

      console.error('Error rejecting/canceling friend request', error)
      enqueueSnackbar('Không thể từ chối/thu hồi lời mời', { variant: 'error' })
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success
      const { type } = variables

      if (type === 'sent') {
        // For sent requests, we've already handled the refresh in onSuccess
        // Add debug logging to see what's happening
        console.log('Friend request cancellation settled, cache state:', {
          hasSentRequestsCache: !!queryClient.getQueryData([
            'sentFriendRequests',
          ]),
          currentData: queryClient.getQueryData(['sentFriendRequests']),
        })
      } else {
        queryClient.invalidateQueries(['receivedFriendRequests'])
      }

      queryClient.invalidateQueries(['friendshipStatus'])
    },
  })

  // Handle accepting a friend request
  const handleAccept = (requestId) => {
    acceptMutation.mutate(requestId)
  }

  // Handle rejecting/canceling a friend request
  const handleReject = (requestId, type = 'received') => {
    rejectMutation.mutate({ requestId, type })
  }

  // Mock friend suggestions data (since it's not in the API)
  const friendSuggestions = [
    { id: 1, fullName: 'Hiệp Võ', mutualGroups: 10 },
    { id: 2, fullName: 'Ngô Quốc Đạt', mutualGroups: 9 },
    { id: 3, fullName: 'Huỳnh Quốc Bảo', mutualGroups: 7 },
    { id: 4, fullName: 'Minh Trang', mutualGroups: 5 },
    { id: 5, fullName: 'Đặng Thoại', mutualGroups: 4 },
    { id: 6, fullName: 'Ng V Thiên', mutualGroups: 4 },
  ]

  // Check if there are any errors loading the data
  const hasError = errorReceived || errorSent

  // Check if data is still loading
  const isLoading = isLoadingReceived || isLoadingSent

  if (hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-red-500">Có lỗi xảy ra khi tải dữ liệu</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-6 py-4">
        <FiUserPlus className="text-xl text-blue-600" />
        <h1 className="text-xl font-medium">Lời mời kết bạn</h1>
      </div>

      <div className="px-6 py-4">
        {/* Received Requests Section */}
        <div className="mb-6">
          <SectionHeader
            title="Lời mời đã nhận"
            count={receivedRequests.length}
            isOpen={sectionsOpen.received}
            onClick={() => toggleSection('received')}
          />

          {sectionsOpen.received &&
            (receivedRequests.length === 0 ? (
              <div className="rounded-lg bg-white p-4 text-center text-gray-500 shadow-sm">
                Bạn không có lời mời kết bạn nào
              </div>
            ) : (
              <div className="space-y-3">
                {receivedRequests.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    requestFriend={request.user}
                    onAccept={handleAccept}
                    onReject={(id) => handleReject(id, 'received')}
                    type="received"
                  />
                ))}
              </div>
            ))}
        </div>

        {/* Sent Requests Section */}
        <div className="mb-6">
          <SectionHeader
            title="Lời mời đã gửi"
            count={sentRequests.length}
            isOpen={sectionsOpen.sent}
            onClick={() => toggleSection('sent')}
          />

          {sectionsOpen.sent &&
            (sentRequests.length === 0 ? (
              <div className="rounded-lg bg-white p-4 text-center text-gray-500 shadow-sm">
                Bạn chưa gửi lời mời kết bạn nào
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request, index) => (
                  <FriendRequestCard
                    key={index}
                    requestFriend={request.friend}
                    onReject={() => handleReject(request.friend.id, 'sent')}
                    type="sent"
                  />
                ))}
              </div>
            ))}
        </div>

        {/* Friend Suggestions Section */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionHeader
              title="Gợi ý kết bạn"
              count={friendSuggestions.length}
              isOpen={sectionsOpen.suggestions}
              onClick={() => toggleSection('suggestions')}
            />
            {sectionsOpen.suggestions && (
              <button className="text-sm text-blue-600 hover:underline">
                Xem thêm &gt;
              </button>
            )}
          </div>

          {sectionsOpen.suggestions && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {friendSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar
                      alt={suggestion.fullName}
                      className="h-12 w-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-medium">{suggestion.fullName}</h3>
                      <p className="text-sm text-gray-500">
                        {suggestion.mutualGroups} nhóm chung
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full gap-2">
                    <button className="flex-1 rounded-md bg-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
                      Bỏ qua
                    </button>
                    <button className="flex-1 rounded-md bg-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
                      Kết bạn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FriendRequests
