import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiChevronRight, FiUserPlus } from 'react-icons/fi'
import {
  cancelFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
  respondToRequest,
} from '../../api/apiFriends'
import { useSocket } from '../../contexts/SocketContext'
import { respondToFriendRequest } from '../../service/socket/friends'
import { getSocket } from '../../service/socket/index'
import { useUserStore } from '../../zustand/userStore'

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

  // Track processed rejections to prevent duplicate notifications
  const processedRejections = useRef(new Set())

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
  } = useQuery({
    queryKey: ['receivedFriendRequests'],
    queryFn: getReceivedFriendRequests,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30000, // 30 seconds
    cacheTime: 60000, // 1 minute
    retry: 1,
    keepPreviousData: true,
  })

  // Fetch sent friend requests
  const {
    data: sentRequestsData,
    isLoading: isLoadingSent,
    error: errorSent,
  } = useQuery({
    queryKey: ['sentFriendRequests'],
    queryFn: getSentFriendRequests,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30000, // 30 seconds
    cacheTime: 60000, // 1 minute
    retry: 1,
    keepPreviousData: true,
  })

  // Process requests data
  const receivedRequests = receivedRequestsData?.data || []
  const sentRequests = sentRequestsData?.data || []

  // Listen for socket events - new implementation
  useEffect(() => {
    // Listen for both friend requests and cancellations
    const rawSocket = getSocket()

    // Set up direct socket listeners for better tracking
    const onDirectFriendRequest = () => {
      // Force immediate refetch
      queryClient.invalidateQueries(['receivedFriendRequests'])
    }

    // Listen for friend request delivery confirmations
    const onFriendRequestDelivered = () => {
      // This event is received by the sender (User A) when their request is delivered
      // Invalidate the sent requests to show the new request in the UI
      queryClient.invalidateQueries(['sentFriendRequests'])
    }

    // Add listener for friend rejections (User B rejects, User A's UI updates)
    const onFriendRejected = (data) => {
      console.log('Friend rejected event:', data)

      // Get current user ID
      const currentUserId = useUserStore.getState().user?.id

      // Create a unique rejection ID to track this specific rejection
      const rejectionId = `${data.from}-${data.friendId}-${Date.now()}`

      // Check if we've already processed this rejection
      if (processedRejections.current.has(rejectionId)) {
        return
      }

      // Mark this rejection as processed
      processedRejections.current.add(rejectionId)

      // After 5 seconds, remove it from processed set to prevent memory leaks
      setTimeout(() => {
        processedRejections.current.delete(rejectionId)
      }, 5000)

      // Based on the console output, we have:
      // - from: ID of User B who rejected (contains User B's ID)
      // - friendId: ID of User A who sent the request (contains User A's ID)

      // ONLY handle notification for User A (the sender)
      if (currentUserId === data.friendId) {
        // Show notification to the user who sent the request
        // This is the distinctive message that only User A (sender) should see
        enqueueSnackbar('Lời mời kết bạn đã bị từ chối', { variant: 'info' })

        // Update sent requests for User A to remove the rejected request
        queryClient.setQueryData(['sentFriendRequests'], (old) => {
          if (!old?.data) return { data: [] }
          return {
            ...old,
            data: old.data.filter((req) => req.friend.id !== data.from),
          }
        })
      }

      // User B (rejector) already handled their UI update in the handleReject function,
      // so we don't need to update it again here - that's what was causing the double notification
    }

    const onDirectFriendRequestCanceled = (data) => {
      // For the receiver (User B): Filter receivedRequests
      queryClient.setQueryData(['receivedFriendRequests'], (old) => {
        if (!old || !old.data) return { data: [] }
        const newData = old.data.filter(
          (request) => request.user?.id !== data.from,
        )
        return { ...old, data: newData }
      })

      // For the sender (User A): Filter sentRequests
      queryClient.setQueryData(['sentFriendRequests'], (old) => {
        if (!old || !old.data) return { data: [] }
        const newData = old.data.filter(
          (request) => request.friend?.id !== data.friendId,
        )
        return { ...old, data: newData }
      })
    }

    const onDirectFriendRequestCanceledConfirmed = (data) => {
      // This is received by User A (the sender who canceled)
      // Ensure sentRequests doesn't contain the canceled request
      queryClient.setQueryData(['sentFriendRequests'], (old) => {
        if (!old || !old.data) return { data: [] }
        const newData = old.data.filter(
          (request) => request.friend?.id !== data.friendId,
        )
        return { ...old, data: newData }
      })
    }

    // Register socket listeners
    rawSocket.on('friend_request', onDirectFriendRequest)
    rawSocket.on('friend_request_delivered', onFriendRequestDelivered)
    rawSocket.on('friend_rejected', onFriendRejected)
    rawSocket.on('friend_request_canceled', onDirectFriendRequestCanceled)
    rawSocket.on(
      'friend_request_canceled_confirmed',
      onDirectFriendRequestCanceledConfirmed,
    )

    // Cleanup listeners when component unmounts
    return () => {
      rawSocket.off('friend_request', onDirectFriendRequest)
      rawSocket.off('friend_request_delivered', onFriendRequestDelivered)
      rawSocket.off('friend_rejected', onFriendRejected)
      rawSocket.off('friend_request_canceled', onDirectFriendRequestCanceled)
      rawSocket.off(
        'friend_request_canceled_confirmed',
        onDirectFriendRequestCanceledConfirmed,
      )
    }
  }, [queryClient])

  // Listen for friend requests notifications
  useEffect(() => {
    if (friendRequests.length > 0) {
      // Force immediate refetch for received requests
      queryClient.invalidateQueries(['receivedFriendRequests'])

      // Clear notifications
      friendRequests.forEach((request) => {
        clearFriendRequest(request.id)
      })
    }
  }, [friendRequests, clearFriendRequest, queryClient])

  // Accept friend request mutation
  const acceptMutation = useMutation({
    mutationFn: (requestId) =>
      respondToRequest({ requestId, status: 'accepted' }),
    onMutate: async (requestId) => {
      await queryClient.cancelQueries(['receivedFriendRequests'])
      const previousRequests = queryClient.getQueryData([
        'receivedFriendRequests',
      ])
      queryClient.setQueryData(['receivedFriendRequests'], (old) => {
        if (!old || !old.data) return old
        return {
          ...old,
          data: old.data.filter((request) => request.id !== requestId),
        }
      })
      return { previousRequests }
    },
    onSuccess: () => {
      enqueueSnackbar('Đã chấp nhận lời mời kết bạn', { variant: 'success' })
      queryClient.invalidateQueries(['friends'])
      queryClient.invalidateQueries(['friendshipStatus'])
    },
    onError: (error, _, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(
          ['receivedFriendRequests'],
          context.previousRequests,
        )
      }

      console.error('Error accepting friend request', error)
      enqueueSnackbar('Không thể chấp nhận lời mời', { variant: 'error' })
    },
  })

  // Reject/Cancel friend request mutation with fixed handling
  // NOTE: This mutation is currently unused since we're using a direct approach
  // Keeping it for reference or future use
  /*
  const rejectMutation = useMutation({
    mutationFn: (requestData) => {
      const { requestId, type } = requestData

      if (type === 'sent') {
        // First emit the socket event for immediate UI update
        cancelFriendRequestSocket(requestId)

        // Then call the API
        return cancelFriendRequest(requestId).then((response) => {
          return { ...response, requestId, type }
        })
      }

      return respondToRequest({ requestId, status: 'rejected' }).then(
        (response) => {
          return { ...response, requestId, type }
        },
      )
    },
    onMutate: async (variables) => {
      const { requestId, type } = variables
      const queryKey =
        type === 'sent' ? ['sentFriendRequests'] : ['receivedFriendRequests']

      // Cancel any outgoing refetches
      await queryClient.cancelQueries(queryKey)

      // Save current data
      const previousData = queryClient.getQueryData(queryKey)

      // Optimistically update cache
      queryClient.setQueryData(queryKey, (old) => {
        if (!old || !old.data) return old

        // Filter out the request being canceled/rejected
        const newData = old.data.filter((request) =>
          type === 'sent'
            ? request.friend.id !== requestId
            : request.id !== requestId,
        )

        return { ...old, data: newData }
      })

      return { previousData, type }
    },
    onSuccess: (response, variables) => {
      const { type } = variables

      // Show success message
      enqueueSnackbar(
        type === 'sent'
          ? 'Đã thu hồi lời mời kết bạn'
          : 'Đã từ chối lời mời kết bạn',
        { variant: 'info' },
      )
    },
    onError: (error, variables, context) => {
      if (context?.previousData && context?.type) {
        const queryKey =
          context.type === 'sent'
            ? ['sentFriendRequests']
            : ['receivedFriendRequests']

        // Restore previous data on error
        queryClient.setQueryData(queryKey, context.previousData)
      }

      console.error('Error rejecting/canceling friend request', error)
      enqueueSnackbar('Không thể từ chối/thu hồi lời mời', { variant: 'error' })
    },
  })
  */

  // Handle accepting a friend request
  const handleAccept = (requestId) => {
    acceptMutation.mutate(requestId)
  }

  // Handle rejecting/canceling a friend request
  const handleReject = (requestId, type = 'received') => {
    if (type === 'sent') {
      // For sent requests (cancellations), we use the socket context function
      // This will both emit the socket event and optimistically update the UI
      cancelFriendRequestSocket(requestId)

      // Also call the API for server-side persistence
      cancelFriendRequest(requestId)
        .then(() => {
          enqueueSnackbar('Đã thu hồi lời mời kết bạn', { variant: 'info' })
        })
        .catch((error) => {
          console.error('Error canceling friend request:', error)
          enqueueSnackbar('Không thể thu hồi lời mời kết bạn', {
            variant: 'error',
          })

          // On error, refetch to ensure UI is in sync with server
          queryClient.fetchQuery({
            queryKey: ['sentFriendRequests'],
            queryFn: getSentFriendRequests,
          })
        })
    } else {
      // For received requests (rejections)
      // For User B (receiver), the requestId is actually userId of the sender (User A)
      const request = receivedRequests.find((req) => req.user.id === requestId)

      if (!request) {
        console.error('Request not found for user ID:', requestId)
        return
      }

      // Create a unique rejection ID to track this specific rejection
      const rejectionId = `${useUserStore.getState().user?.id}-${requestId}-${Date.now()}`

      // Mark this rejection as processed
      processedRejections.current.add(rejectionId)

      // After 5 seconds, remove it from processed set to prevent memory leaks
      setTimeout(() => {
        processedRejections.current.delete(rejectionId)
      }, 5000)

      // 1. Immediately update UI by removing the request - this ensures User B sees it gone
      queryClient.setQueryData(['receivedFriendRequests'], (old) => {
        if (!old?.data) return { data: [] }
        return {
          ...old,
          data: old.data.filter((req) => req.user.id !== requestId),
        }
      })

      // 2. Show a quiet success message to User B only (they're the one rejecting)
      // Use a different variant (default instead of info) to make it less prominent
      enqueueSnackbar('Đã từ chối lời mời', { variant: 'default' })

      // 3. Send socket event to notify User A
      // The requestId for socket is actually the id of the sender (User A)
      respondToFriendRequest(requestId, 'rejected', requestId)

      // 4. Call API to persist rejection - API expects the sender's ID as requestId
      respondToRequest({ requestId, status: 'rejected' }).catch((error) => {
        console.error('Error rejecting request:', error)

        // If API fails, show error and refetch to sync with server
        enqueueSnackbar('Lỗi khi từ chối lời mời, đang thử lại...', {
          variant: 'error',
        })

        // Force refetch to get current state from server
        queryClient.invalidateQueries(['receivedFriendRequests'])
      })
    }
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
