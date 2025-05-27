import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import axiosRetry from "axios-retry";

import { useUserStore } from "../../store/userStore";
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  noCache?: boolean;
  cached?: boolean;
  cachedResponse?: any;
  _retry?: boolean;
}

// API URLs configuration for different environments
// Determine the best API URL to use based on the platform and environment
const API_URLS = [
  "https://strongly-boss-finch.ngrok-free.app/api",
  "http://192.168.0.105:8081/api",
];

const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

// Create axios instance with better logging for debugging
const axiosInstance = axios.create({
  baseURL:
    process.env.EXPO_NGROK_ENABLED === "true" ? API_URLS[0] : API_URLS[1],
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log which base URL is being used
console.log("Using API baseURL:", axiosInstance.defaults.baseURL);

// Add request caching for GET requests
const addCacheInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    async (config: ExtendedAxiosRequestConfig) => {
      // Log all requests
      console.log(
        `Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      );

      // Only cache GET requests
      if (config.method?.toLowerCase() !== "get" || config.noCache) {
        return config;
      }

      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cachedResponseString = await AsyncStorage.getItem(
        `cache_${cacheKey}`,
      );

      if (cachedResponseString) {
        const cachedResponse = JSON.parse(cachedResponseString);
        if (
          cachedResponse &&
          Date.now() - cachedResponse.timestamp < CACHE_TIME
        ) {
          // Return cached response
          return {
            ...config,
            cached: true,
            cachedResponse: cachedResponse.data,
          };
        }
      }

      return config;
    },
    (error) => {
      console.error("Request error:", error);
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    async (response) => {
      console.log(
        `Response: ${response.config.url} - Status: ${response.status}`,
      );

      const config = response.config as ExtendedAxiosRequestConfig;
      // Skip if this is a cached response
      if (config.cached) {
        return config.cachedResponse;
      }

      // Cache GET responses
      if (config.method?.toLowerCase() === "get" && !config.noCache) {
        const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
        await AsyncStorage.setItem(
          `cache_${cacheKey}`,
          JSON.stringify({
            timestamp: Date.now(),
            data: response.data,
          }),
        );
      }

      return response && response.data ? response.data : response;
    },
    async (error) => {
      console.error("Response error:", error.message);
      if (error.response) {
        console.error("Response error data:", error.response.data);
        console.error("Response error status:", error.response.status);
      } else if (error.request) {
        console.error("Request error:", error.request);
      }

      const originalRequest = error.config as ExtendedAxiosRequestConfig;

      // Handle refresh token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          // For mobile, we may not have a refresh token endpoint, so just log the user out
          useUserStore.getState().logout();
          return Promise.reject(error);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      return error && error.response?.data
        ? error.response.data
        : Promise.reject(error);
    },
  );
};

// Add authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Apply cache interceptor
addCacheInterceptor(axiosInstance);

// Configure retry with exponential backoff
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError): boolean => {
    // Retry on network errors and 5xx responses
    return !!(
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status >= 500)
    );
  },
});

export default axiosInstance;
