import { Linking } from "react-native";

/**
 * Opens a file URL on the device
 */
export const openFile = async (url: string): Promise<boolean> => {
  // Check if the URL can be opened
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    try {
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.error("Error opening file URL:", error);
      return false;
    }
  }
  return false;
};

/**
 * Gets the file extension from a URL or path
 */
export const getFileExtension = (url: string): string => {
  if (!url) return "";
  const parts = url.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
};

/**
 * Checks if the file is an image based on its extension
 */
export const isImageFile = (url: string): boolean => {
  const extension = getFileExtension(url);
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic"];
  return imageExtensions.includes(extension);
};

/**
 * Checks if the file is a GIF
 */
export const isGifFile = (url: string): boolean => {
  const extension = getFileExtension(url);
  return extension === "gif";
};

/**
 * Formats the file size for display
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Gets a file's icon name based on its type or extension
 */
export const getFileIconName = (fileType: string, url: string): string => {
  const extension = getFileExtension(url);

  // Default icon
  let iconName = "document";

  // Check file type or extension
  if (fileType?.includes("pdf") || extension === "pdf") {
    iconName = "file-pdf";
  } else if (
    fileType?.includes("word") ||
    ["doc", "docx"].includes(extension)
  ) {
    iconName = "file-word";
  } else if (
    fileType?.includes("excel") ||
    ["xls", "xlsx"].includes(extension)
  ) {
    iconName = "file-excel";
  } else if (
    fileType?.includes("powerpoint") ||
    ["ppt", "pptx"].includes(extension)
  ) {
    iconName = "file-powerpoint";
  } else if (
    fileType?.includes("zip") ||
    ["zip", "rar", "7z"].includes(extension)
  ) {
    iconName = "file-archive";
  } else if (
    fileType?.includes("audio") ||
    ["mp3", "wav", "ogg"].includes(extension)
  ) {
    iconName = "file-audio";
  } else if (
    fileType?.includes("video") ||
    ["mp4", "avi", "mov"].includes(extension)
  ) {
    iconName = "file-video";
  } else if (fileType?.includes("image") || isImageFile(url)) {
    iconName = "file-image";
  } else if (fileType?.includes("text") || ["txt", "md"].includes(extension)) {
    iconName = "file-alt";
  }

  return iconName;
};
