import axios from "axios";
import axiosRetry from "axios-retry";

import { useUserStore } from "../../store/userStore";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Configure axios-retry
axiosRetry(axiosInstance, {
  retries: 3, // Number of retry attempts
  retryDelay: (retryCount) => {
    return retryCount * 1000; // Time delay between retries (1s, 2s, 3s)
  },
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return !!(
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status && error.response.status >= 500)
    );
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get token from Zustand store
    const token = useUserStore.getState().token;

    // If token exists, add it to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear user data and token
      useUserStore.getState().logout();

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
