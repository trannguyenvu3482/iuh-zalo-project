import { Platform } from "react-native";

// API URL should be a full URL including protocol, host, and port
// Mobile connections to localhost require special handling
// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, use localhost
const isAndroid = Platform.OS === "android";
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (isAndroid ? "http://10.0.2.2:8081" : "http://localhost:8081");

// Log the API URL for debugging purposes
console.log("API URL:", API_URL);
