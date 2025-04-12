import axios from 'axios'
import axiosRetry from 'axios-retry'
import { useUserStore } from '../zustand/userStore'

const BASE_URL = [
  'http://localhost:8081/api',
  'https://main-gradually-octopus.ngrok-free.app/api/v1',
  'https://e3327ca97bd21c.lhr.life/api/v1',
]

// Create a request cache to avoid duplicate requests
const requestCache = new Map()
const CACHE_TIME = 5 * 60 * 1000 // 5 minutes

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL_NGROK + '/api' || BASE_URL[0],
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // Add timeout to prevent hanging requests
})

// Add request caching for GET requests
const addCacheInterceptor = (instance) => {
  instance.interceptors.request.use(
    async (config) => {
      // Only cache GET requests
      if (config.method.toLowerCase() !== 'get' || config.noCache) {
        return config
      }

      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`
      const cachedResponse = requestCache.get(cacheKey)

      if (
        cachedResponse &&
        Date.now() - cachedResponse.timestamp < CACHE_TIME
      ) {
        // Return cached response
        return {
          ...config,
          cached: true,
          cachedResponse: cachedResponse.data,
        }
      }

      return config
    },
    (error) => Promise.reject(error),
  )

  instance.interceptors.response.use(
    (response) => {
      // Skip if this is a cached response
      if (response.config.cached) {
        return response.config.cachedResponse
      }

      // Cache GET responses
      if (
        response.config.method.toLowerCase() === 'get' &&
        !response.config.noCache
      ) {
        const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`
        requestCache.set(cacheKey, {
          timestamp: Date.now(),
          data: response.data,
        })
      }

      return response && response.data ? response.data : response
    },
    async (error) => {
      // Rest of error handling logic...
      const originalRequest = error.config

      // Handle refresh token
      if (
        error.response?.data?.statusCode === -1 &&
        error.response?.status === 401 &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true
        try {
          const setAccessToken = useUserStore.getState().setAccessToken
          setAccessToken(null)
          const response = await instance.get('/auth/refresh-token')
          const accessToken = response.data.access_token
          setAccessToken(accessToken)
          instance.defaults.headers.common['Authorization'] =
            `Bearer ${accessToken}`
          return instance(originalRequest)
        } catch (refreshError) {
          const logout = useUserStore.getState().logout
          logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else if (
        error.response?.data?.statusCode === 400 &&
        error.response?.data?.error === 'Bạn không có refresh_token ở cookies'
      ) {
        const logout = useUserStore.getState().logout
        logout()
        window.location.href = '/login'
      }

      return error && error.response?.data
        ? error.response.data
        : Promise.reject(error)
    },
  )
}

// Add authorization header
instance.interceptors.request.use(
  (config) => {
    const accessToken = useUserStore.getState().accessToken

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Apply cache interceptor
addCacheInterceptor(instance)

// Configure retry with exponential backoff
axiosRetry(instance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors and 5xx responses
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status >= 500)
    )
  },
})

export default instance
