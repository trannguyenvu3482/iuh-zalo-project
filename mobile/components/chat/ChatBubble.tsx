import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";

// eslint-disable-next-line import/order
import {
  formatFileSize,
  getFileExtension,
  getFileIconName,
  isGifFile,
  isImageFile,
  openFile,
} from "../../utils/fileUtils";
import ReactionPanel from "./ReactionPanel";
import { Message, Reaction, REACTION_ICONS } from "./types";

interface ChatBubbleProps {
  message: Message;
  onReaction: (messageId: string, reaction: Reaction) => void;
  onReply: (message: Message) => void;
  currentUserId?: string;
}

const ChatBubble = ({
  message,
  onReaction,
  onReply,
  currentUserId = "2c6e2230-ca35-43fb-86ed-97f0d0321105",
}: ChatBubbleProps) => {
  const [showReactions, setShowReactions] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [showReplyIcon, setShowReplyIcon] = useState(false);
  const bubbleRef = useRef<View>(null);
  const [bubbleLayout, setBubbleLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const videoRef = useRef(null);

  // Improved pan responder with proper typing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (
        _,
        gestureState: PanResponderGestureState,
      ) => Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dy) < 10,
      onPanResponderGrant: () => {
        // Reset animation to 0 on touch start
        slideAnimation.setValue(0);
      },
      onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
        if (gestureState.dx > 0) {
          // Clamp value to max 80, and add a dampening effect for smoother feel
          const dampened = Math.min(80, gestureState.dx * 0.8);
          slideAnimation.setValue(dampened);

          // Show reply icon when dragged more than 30px
          if (dampened > 30 && !showReplyIcon) {
            setShowReplyIcon(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else if (dampened <= 30 && showReplyIcon) {
            setShowReplyIcon(false);
          }
        }
      },
      onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
        if (gestureState.dx > 40) {
          // Trigger reply if swiped enough
          handleReply();
        }

        // Reset animation with spring physics for smoother return
        Animated.spring(slideAnimation, {
          toValue: 0,
          friction: 8, // More friction for less bouncing
          tension: 60, // Less tension for smoother movement
          useNativeDriver: true,
        }).start();
        setShowReplyIcon(false);
      },
    }),
  ).current;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Measure bubble position for placing reaction panel
    if (bubbleRef.current) {
      bubbleRef.current.measure((x, y, width, height, pageX, pageY) => {
        setBubbleLayout({ x: pageX, y: pageY, width, height });
        setShowReactions(true);
      });
    } else {
      setShowReactions(true);
    }
  };

  const handleReaction = (reaction: Reaction) => {
    onReaction(message.id, reaction);
    setShowReactions(false);
  };

  const handleAction = (action: string) => {
    if (action === "reply") {
      handleReply();
    }
    // Handle other actions...
  };

  const handleReply = () => {
    onReply(message);
  };

  const handleQuickReaction = () => {
    // Quick heart reaction if no reaction exists, otherwise remove reaction
    if (!message.reaction) {
      onReaction(message.id, "heart");
    } else {
      onReaction(message.id, "");
    }
  };

  const handleFilePress = () => {
    const fileUrl =
      message.fileUrl ||
      message.file?.url ||
      message.file?.uri ||
      message.content;
    if (!fileUrl) return;

    // Check if it's an image
    const isImage =
      message.fileType?.startsWith("image/") ||
      message.file?.type?.startsWith("image/") ||
      isImageFile(fileUrl);

    // Check if it's a video
    const isVideo =
      message.fileType?.startsWith("video/") ||
      message.file?.type?.startsWith("video/") ||
      ["mp4", "mov", "avi", "webm"].includes(getFileExtension(fileUrl));

    if (isImage) {
      setIsImageViewerOpen(true);
    } else if (isVideo) {
      // For videos, toggle playback state
      setIsVideoPlaying(!isVideoPlaying);
    } else {
      openFile(fileUrl).catch((error: Error) =>
        console.error("Error opening file URL:", error),
      );
    }
  };

  const formatTimestamp = (timestamp?: Date | string) => {
    if (!timestamp) return "";

    if (timestamp instanceof Date) {
      return timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If it's a string from API (ISO format)
    if (typeof timestamp === "string") {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    return String(timestamp);
  };

  // Check if message is a GIF
  const isGifMessage = () => {
    if (message.type === "GIF") {
      if (
        message.fileType === "image/gif" ||
        message.file?.type === "image/gif"
      )
        return true;

      const fileUri =
        message.fileUrl ||
        message.file?.url ||
        message.file?.uri ||
        message.content;
      if (fileUri && typeof fileUri === "string") {
        return isGifFile(fileUri);
      }
    }
    return false;
  };

  // Helper function to determine file icon based on mimetype
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "videocam";
    if (mimeType.startsWith("audio/")) return "musical-notes";
    if (mimeType.includes("pdf")) return "document-text";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "document-text";
    if (mimeType.includes("excel") || mimeType.includes("sheet")) return "grid";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
      return "easel";
    if (mimeType.includes("zip") || mimeType.includes("compressed"))
      return "archive";
    // Add more mappings based on the web version
    if (mimeType.includes("csv")) return "grid";
    if (mimeType.includes("text/") || mimeType.includes("txt"))
      return "document-text";
    if (mimeType.includes("html")) return "code";
    return "document";
  };

  // Get file size in human-readable format
  const getFormattedFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown";

    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // System message
  if (message.isSystemMessage || message.type === "SYSTEM") {
    return (
      <View className="bg-gray-100 px-4 py-1 rounded-full self-center my-2">
        <Text className="text-sm text-gray-500">
          {message.message || message.content}
        </Text>
      </View>
    );
  }

  // Handle recalled messages
  if (message.isRecalled) {
    return (
      <View className="bg-gray-100 px-4 py-1 rounded-2xl self-center my-2">
        <View className="flex-row items-center">
          <Ionicons name="alert-circle-outline" size={16} color="#666" />
          <Text className="text-sm text-gray-500 ml-1">
            This message has been recalled
          </Text>
        </View>
      </View>
    );
  }

  // Determine if the current user is the sender
  const isSender =
    typeof message.sender === "object"
      ? message.sender?.id === currentUserId
      : message.sender === "me";

  // Render reply reference if this message is a reply
  const renderReplyReference = () => {
    if (!message.replyTo && !message.replyToId) return null;

    const replyMsg = message.replyTo || ({} as Message);
    const replySender =
      typeof replyMsg.sender === "object"
        ? replyMsg.sender?.fullName || "User"
        : replyMsg.sender === "me"
          ? "You"
          : "User";

    const previewContent = replyMsg.content || replyMsg.message || "";
    const previewText =
      previewContent.length > 30
        ? previewContent.substring(0, 30) + "..."
        : previewContent;

    return (
      <View className="bg-gray-100 rounded-md p-1 mb-1">
        <Text className="text-xs font-medium text-blue-600">{replySender}</Text>
        <Text className="text-xs text-gray-600">{previewText}</Text>
      </View>
    );
  };

  // Render file message
  const renderFileMessage = () => {
    const fileUrl =
      message.fileUrl ||
      message.file?.url ||
      message.file?.uri ||
      message.content;
    if (!fileUrl) return null;

    const fileName =
      message.fileName ||
      message.file?.name ||
      message.file?.filename ||
      fileUrl.split("/").pop() ||
      "File";
    const fileType =
      message.fileType || message.file?.type || message.file?.mimeType || "";
    const fileSize = message.fileSize || message.file?.size;

    const isImage = fileType.startsWith("image/") || isImageFile(fileUrl);
    const isVideo =
      fileType.startsWith("video/") ||
      ["mp4", "mov", "avi", "webm"].includes(getFileExtension(fileUrl));
    const isGif = message.type === "GIF";

    if (isImage) {
      return (
        <TouchableOpacity onPress={handleFilePress} className="mt-1">
          <View className="relative">
            <Image
              source={{ uri: fileUrl }}
              className="w-48 h-48 rounded-md object-cover"
              resizeMode="contain"
            />
            {isGif && (
              <View className="absolute bottom-2 left-2 bg-black/50 rounded px-1.5 py-0.5">
                <Text className="text-white text-xs font-medium">GIF</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    } else if (isGif) {
      return (
        <TouchableOpacity onPress={handleFilePress} className="mt-1">
          <Image source={{ uri: fileUrl }} className="w-48 h-48 rounded-md" />
        </TouchableOpacity>
      );
    } else if (isVideo) {
      return (
        <View className="mt-1">
          <TouchableOpacity onPress={handleFilePress} className="relative">
            <Video
              ref={videoRef}
              source={{ uri: fileUrl }}
              className="h-48 w-48 rounded-md bg-black"
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls={isVideoPlaying}
              isLooping={false}
              shouldPlay={isVideoPlaying}
            />
            {!isVideoPlaying && (
              <View className="absolute inset-0 items-center justify-center">
                <View className="bg-black/40 rounded-full p-3">
                  <Ionicons name="play" size={24} color="white" />
                </View>
              </View>
            )}
          </TouchableOpacity>
          {fileName && (
            <Text className="text-xs mt-1 text-gray-500" numberOfLines={1}>
              {fileName}
            </Text>
          )}
        </View>
      );
    } else {
      // Document file
      const iconName = getFileIconName(fileType, fileUrl);
      return (
        <TouchableOpacity
          onPress={handleFilePress}
          className="flex-row items-center mt-1 p-2 bg-gray-100 rounded-md"
        >
          <Ionicons
            name={iconName}
            size={24}
            color={isSender ? "#4B68D9" : "#666"}
          />
          <View className="ml-2 flex-1">
            <Text className="font-medium" numberOfLines={1}>
              {fileName}
            </Text>
            <Text className="text-xs text-gray-500">
              {fileSize ? formatFileSize(Number(fileSize)) : ""}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View className={`w-full flex ${isSender ? "items-end" : "items-start"}`}>
      <Animated.View
        ref={bubbleRef}
        onLayout={() => {
          if (bubbleRef.current && bubbleLayout.width === 0) {
            bubbleRef.current.measure((x, y, width, height, pageX, pageY) => {
              setBubbleLayout({ x: pageX, y: pageY, width, height });
            });
          }
        }}
        style={{
          transform: [{ translateX: slideAnimation }],
          maxWidth: "80%",
        }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onLongPress={handleLongPress}
          onPress={handleQuickReaction}
          delayLongPress={200}
          activeOpacity={0.8}
          className="relative mb-1"
        >
          {renderReplyReference()}

          {message.type === "TEXT" ? (
            <View
              className={`rounded-2xl px-3 py-2 ${
                isSender
                  ? "bg-blue-500 rounded-tr-none"
                  : "bg-white border border-gray-200 rounded-tl-none"
              }`}
            >
              <Text className={isSender ? "text-white" : "text-gray-800"}>
                {message.content}
              </Text>
              <Text
                className={`text-xs mt-1 text-right ${
                  isSender ? "text-white/60" : "text-gray-500"
                }`}
              >
                {formatTimestamp(message.created_at || message.timestamp)}
              </Text>
            </View>
          ) : message.type === "FILE" ||
            message.type === "IMAGE" ||
            message.type === "GIF" ||
            message.type === "VIDEO" ||
            message.type === "AUDIO" ? (
            renderFileMessage()
          ) : (
            <View
              className={`rounded-2xl px-3 py-2 ${
                isSender
                  ? "bg-blue-500 rounded-tr-none"
                  : "bg-white border border-gray-200 rounded-tl-none"
              }`}
            >
              <Text className={isSender ? "text-white" : "text-gray-800"}>
                {message.content}
              </Text>
              <Text
                className={`text-xs mt-1 text-right ${
                  isSender ? "text-white/60" : "text-gray-500"
                }`}
              >
                {formatTimestamp(message.created_at || message.timestamp)}
              </Text>
            </View>
          )}

          {/* Reaction */}
          {message.reaction && (message.reaction as string) !== "" && (
            <View
              className={`absolute -bottom-3 ${
                isSender ? "right-2" : "left-2"
              }`}
            >
              <View className="bg-white rounded-full shadow-sm p-1 border border-gray-100">
                {REACTION_ICONS[
                  message.reaction as keyof typeof REACTION_ICONS
                ] && (
                  <Ionicons
                    name={
                      REACTION_ICONS[
                        message.reaction as keyof typeof REACTION_ICONS
                      ].name as any
                    }
                    size={16}
                    color={
                      REACTION_ICONS[
                        message.reaction as keyof typeof REACTION_ICONS
                      ].color
                    }
                  />
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Reply Icon */}
        {showReplyIcon && (
          <View
            className="absolute left-0 h-full justify-center"
            style={{ left: -40 }}
          >
            <View className="bg-gray-100 rounded-full p-2">
              <Ionicons name="arrow-undo" size={16} color="#666" />
            </View>
          </View>
        )}
      </Animated.View>

      {/* Reaction Panel */}
      <Modal
        visible={showReactions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowReactions(false)}>
          <View className="flex-1 bg-black/20">
            <View
              style={{
                position: "absolute",
                top: bubbleLayout.y + bubbleLayout.height + 5,
                left: isSender ? undefined : bubbleLayout.x,
                right: isSender ? 20 : undefined,
              }}
            >
              <ReactionPanel onSelectReaction={handleReaction} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal visible={isImageViewerOpen} transparent>
        <ImageViewer
          imageUrls={[{ url: message.fileUrl || message.content || "" }]}
          enableSwipeDown
          onSwipeDown={() => setIsImageViewerOpen(false)}
          onClick={() => setIsImageViewerOpen(false)}
          backgroundColor="rgba(0,0,0,0.9)"
        />
        <TouchableOpacity
          onPress={() => setIsImageViewerOpen(false)}
          className="absolute top-12 right-4 bg-black/50 rounded-full p-2"
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ChatBubble;
