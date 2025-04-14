import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
import {
  cancelFriendRequest,
  getFriendshipStatus,
  removeFriend,
  respondToRequest,
  sendFriendRequest,
} from '../api/apiFriends'

// Storage key format for localStorage
const getStorageKey = (userId) => `friendship_status_${userId}`

/**
 * Custom hook to handle friendship actions and status
 */
export const useFriendship = (userId, isCurrentUser) => {
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [friendshipStatus, setFriendshipStatus] = useState({
    isFriend: false,
    hasSentRequest: false,
    hasReceivedRequest: false,
  })

  // Load initial state from localStorage if available
  useEffect(() => {
    if (userId && !isCurrentUser) {
      try {
        const storedData = localStorage.getItem(getStorageKey(userId))
        if (storedData) {
          const parsedData = JSON.parse(storedData)
          if (parsedData.status) {
            // Update the friendship status based on stored data
            updateLocalState(parsedData.status)
          }
        }
      } catch (e) {
        console.error('Error loading stored friendship status:', e)
      }
    }
  }, [userId, isCurrentUser])

  // Helper to update local state based on API status
  const updateLocalState = (statusString) => {
    const newState = {
      isFriend: statusString === 'FRIENDS',
      hasSentRequest: statusString === 'REQUEST_SENT',
      hasReceivedRequest: statusString === 'REQUEST_RECEIVED',
    }
    setFriendshipStatus(newState)
    return newState
  }

  // Helper to update storage and cache
  const updateStorage = (userId, statusData) => {
    // Update React Query cache
    queryClient.setQueryData(['friendshipStatus', userId], {
      data: statusData,
    })

    // Update localStorage
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(statusData))
    } catch (e) {
      console.error('Error storing friendship status:', e)
    }
  }

  // Query for friendship status
  const { refetch: refetchFriendship } = useQuery({
    queryKey: ['friendshipStatus', userId],
    queryFn: () => {
      if (!userId || isCurrentUser) return null
      return getFriendshipStatus(userId)
    },
    enabled: !!userId && !isCurrentUser,
    onSuccess: (response) => {
      if (response?.data?.status) {
        const { status } = response.data

        // Update local state
        updateLocalState(status)

        // Store the response
        updateStorage(userId, response.data)
      }
    },
    // Keep data fresh
    staleTime: 0,
    cacheTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 10000, // Refetch every 10 seconds
  })

  // Handle friend request
  const handleFriendAction = async (userForAction) => {
    if (isLoading || !userForAction?.id) return

    setIsLoading(true)

    try {
      if (friendshipStatus.isFriend) {
        // Remove friend
        await removeFriend(userForAction.id)
        setFriendshipStatus({
          isFriend: false,
          hasSentRequest: false,
          hasReceivedRequest: false,
        })

        // Update storage with new status
        updateStorage(userForAction.id, { status: 'NOT_FRIENDS' })

        enqueueSnackbar('Đã huỷ kết bạn thành công', { variant: 'success' })
      } else if (friendshipStatus.hasSentRequest) {
        // Cancel request
        await cancelFriendRequest(userForAction.id)
        setFriendshipStatus({
          isFriend: false,
          hasSentRequest: false,
          hasReceivedRequest: false,
        })

        // Update storage with new status
        updateStorage(userForAction.id, { status: 'NOT_FRIENDS' })

        enqueueSnackbar('Đã huỷ lời mời kết bạn', { variant: 'success' })
      } else if (friendshipStatus.hasReceivedRequest) {
        // Accept request
        const requestData = await getFriendshipStatus(userForAction.id)
        if (requestData?.data?.requestId) {
          await respondToRequest({
            requestId: requestData.data.requestId,
            status: 'accepted',
          })
          setFriendshipStatus({
            isFriend: true,
            hasSentRequest: false,
            hasReceivedRequest: false,
          })

          // Update storage with new status
          const updatedData = {
            status: 'FRIENDS',
            friendship: {
              ...requestData?.data?.friendship,
              status: 'ACCEPTED',
            },
          }
          updateStorage(userForAction.id, updatedData)

          enqueueSnackbar('Đã chấp nhận lời mời kết bạn', {
            variant: 'success',
          })
        } else {
          enqueueSnackbar('Không tìm thấy yêu cầu kết bạn', {
            variant: 'error',
          })
        }
      } else {
        // Send request
        const response = await sendFriendRequest({
          userId: userForAction.id,
          message: '',
        })

        // Update local state immediately
        setFriendshipStatus({
          isFriend: false,
          hasSentRequest: true,
          hasReceivedRequest: false,
        })

        // Update storage with new status
        const updatedData = {
          status: 'REQUEST_SENT',
          friendship: {
            userId: response?.data?.userId,
            friendId: userForAction.id,
            status: 'PENDING',
          },
        }
        updateStorage(userForAction.id, updatedData)

        enqueueSnackbar('Đã gửi lời mời kết bạn', { variant: 'success' })
      }

      // Final refetch to ensure data consistency
      await refetchFriendship()
    } catch (error) {
      console.error('Friend action error:', error)
      enqueueSnackbar(
        error.response?.data?.message || 'Không thể thực hiện hành động',
        { variant: 'error' },
      )
    } finally {
      setIsLoading(false)
    }
  }

  return {
    friendshipStatus,
    isLoading,
    handleFriendAction,
    refetchFriendship,
  }
}
