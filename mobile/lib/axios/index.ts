import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import axiosRetry from "axios-retry";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { useUserStore } from "../../store/userStore";

// API URLs configuration for different environments
const API_URLS = {
  // For development on emulators
  EMULATOR: {
    ANDROID: "http://192.168.1.57:8081/api", // Special IP that Android emulator uses to access host machine
    IOS: "http://192.168.1.57:8081/api", // iOS simulator can access localhost of host machine
  },
  // For web or Expo Go (web works with localhost, Expo Go needs network IP)
  WEB: "http://localhost:8081/api",
  // Production or hosted API
  PRODUCTION: "https://main-gradually-octopus.ngrok-free.app/api/v1",
  // Backup API URL if the main one fails, get from computer IP
  BACKUP: `http://192.168.1.57:8081/api`,
};

// Get API URL from environment variables or use fallback
const apiUrlFromEnv = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;

// Determine the best API URL to use based on the platform and environment
const determineApiUrl = (): string => {
  // If there's an environment variable specified, use it
  if (apiUrlFromEnv) {
    return apiUrlFromEnv;
  }

  // Otherwise choose based on platform
  if (Platform.OS === "web") {
    return API_URLS.WEB;
  }

  // For native mobile platforms
  if (Platform.OS === "android") {
    return API_URLS.EMULATOR.ANDROID;
  }

  if (Platform.OS === "ios") {
    return API_URLS.EMULATOR.IOS;
  }

  // Fallback to production URL
  return API_URLS.BACKUP;
};

// Get the initial API URL
const INITIAL_API_URL = determineApiUrl();

// Create a request cache to avoid duplicate requests
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

// Extend the InternalAxiosRequestConfig type to include our custom properties
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  noCache?: boolean;
  cached?: boolean;
  cachedResponse?: any;
  _retry?: boolean;
}

// Log the available URLs
console.log("API URLS configuration:", {
  fromEnv: apiUrlFromEnv,
  selected: INITIAL_API_URL,
  available: API_URLS,
});

// Create axios instance with better logging for debugging
const axiosInstance = axios.create({
  baseURL: INITIAL_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log which base URL is being used
console.log("Using API baseURL:", axiosInstance.defaults.baseURL);

// Function to test API connection and fallback if needed
const testApiConnection = async (): Promise<void> => {
  try {
    // Try a simple GET request to check if the API is accessible
    await axios.get(`${axiosInstance.defaults.baseURL}/health`, {
      timeout: 5000,
    });
    console.log("API connection test successful");
  } catch (error) {
    console.warn("API connection test failed, trying fallback URL");

    // Try the backup URL
    try {
      await axios.get(`${API_URLS.BACKUP}/health`, { timeout: 5000 });
      console.log("Fallback API connection successful, switching to fallback");

      // Switch to the backup URL
      axiosInstance.defaults.baseURL = API_URLS.BACKUP;
      console.log("Now using API baseURL:", axiosInstance.defaults.baseURL);
    } catch (fallbackError) {
      console.error(
        "All API connections failed, using production URL as last resort",
      );
      axiosInstance.defaults.baseURL = API_URLS.BACKUP;
    }
  }
};

// Run the connection test when the app starts
testApiConnection();

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
