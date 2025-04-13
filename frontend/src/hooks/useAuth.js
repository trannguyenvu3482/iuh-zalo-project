import { useEffect, useState } from 'react'
import { getUserInfo } from '../api/apiUser'
import { onProfileUpdated } from '../service/socket'
import { useUserStore } from '../zustand/userStore'
import { useDebounce } from './useDebounce'

export const useAuth = () => {
  const [user, setUser] = useState(useUserStore.getState().user)
  const [isAuthenticated, setIsAuthenticated] = useState(
    useUserStore.getState().isAuthenticated,
  )
  const [accessToken, setAccessToken] = useState(
    useUserStore.getState().accessToken,
  )
  const [isLoading, setIsLoading] = useState(false)

  // Debounce accessToken và user để tránh việc gọi API liên tục
  const debouncedAccessToken = useDebounce(accessToken, 500)
  const debouncedUser = useDebounce(user, 500)

  // Subscribe to store changes
  useEffect(() => {
    const unsubUser = useUserStore.subscribe(
      (s) => s.user,
      (v) => setUser(v),
    )
    const unsubAuth = useUserStore.subscribe(
      (s) => s.isAuthenticated,
      (v) => setIsAuthenticated(v),
    )
    const unsubToken = useUserStore.subscribe(
      (s) => s.accessToken,
      (v) => setAccessToken(v),
    )

    return () => {
      unsubUser()
      unsubAuth()
      unsubToken()
    }
  }, [])

  // Listen for profile updates via socket
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    // Setup socket listener for profile updates
    const unsubscribe = onProfileUpdated((data) => {
      console.log('Profile updated via socket:', data)
      if (data && data.user && data.user.id === user?.id) {
        // Merge the received data with existing user data
        const updatedUser = { ...user, ...data.user }
        // Update user in the store
        useUserStore.setState({ user: updatedUser })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [isAuthenticated, accessToken, user])

  // Auto-fetch user data when accessToken or user info is missing
  useEffect(() => {
    const fetchUserData = async () => {
      if (
        isAuthenticated &&
        debouncedAccessToken && // Sử dụng debounced accessToken
        (!debouncedUser ||
          !debouncedUser.id ||
          !debouncedUser.fullName ||
          !debouncedUser.phoneNumber)
      ) {
        try {
          setIsLoading(true)
          const response = await getUserInfo()

          if (response && response.data) {
            // Update user in the store
            useUserStore.setState({ user: response.data })
          }
        } catch (error) {
          console.error('Failed to fetch user information:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchUserData()
  }, [debouncedAccessToken, debouncedUser, isAuthenticated])

  return { user, isAuthenticated, accessToken, isLoading }
}
