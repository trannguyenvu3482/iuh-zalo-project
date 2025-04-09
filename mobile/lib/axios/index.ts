import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import axiosRetry from "axios-retry";

import { useUserStore } from "../../store/userStore";

const BASE_URL = [
  "http://localhost:8081/api",
  "https://main-gradually-octopus.ngrok-free.app/api/v1",
  "https://e3327ca97bd21c.lhr.life/api/v1",
];

// Create a request cache to avoid duplicate requests
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

// Extend the InternalAxiosRequestConfig type to include our custom properties
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  noCache?: boolean;
  cached?: boolean;
  cachedResponse?: any;
  _retry?: boolean;
}

// Create axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL[0], // Use the first URL as default
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request caching for GET requests
const addCacheInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    async (config: ExtendedAxiosRequestConfig) => {
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
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    async (response) => {
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
