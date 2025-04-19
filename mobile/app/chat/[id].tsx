import { Ionicons } from "@expo/vector-icons";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMessages, sendMessage } from "~/api/apiMessage";
import ChatBubble from "~/components/chat/ChatBubble";
import ChatHeader from "~/components/chat/ChatHeader";
import ChatInput from "~/components/chat/ChatInput";
import { Message, Reaction, User } from "~/components/chat/types";
import { useAuth } from "~/contexts/AuthContext";
import { useSocket } from "~/hooks/useSocket";
import { useSocketStore } from "~/store/socketStore";
import { useUserStore } from "~/store/userStore";

type ExtendedMessage = Message;

export default function Chat() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const { user } = useUserStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const playbackUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    hasMore: true,
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Socket store for real-time updates
  const { messages: socketMessages = {}, addMessage: addSocketMessage } =
    useSocketStore();

  // Initialize socket connection
  const { sendMessage: sendSocketMessage } = useSocket(token || "");

  // Store generated waveforms per message
  const [waveforms] = useState<Record<string, number[]>>({});

  // Store animated values for waveform bars
  const [animatedValues, setAnimatedValues] = useState<
    Record<string, Animated.Value[]>
  >({});

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await getMessages(id as string, {
          limit: pagination.limit,
          offset: 0,
        });

        console.log("Initial API response structure:", Object.keys(response));
        const responseMessages =
          response.messages || response.data?.messages || [];
        const paginationInfo = response.pagination || response.data?.pagination;

        // Update pagination info
        setPagination({
          offset: pagination.limit,
          limit: pagination.limit,
          hasMore:
            !!paginationInfo?.hasMore ||
            responseMessages.length >= pagination.limit,
        });

        // Transform messages to match the expected format
        const transformedMessages = responseMessages.map(
          (msg: {
            id: string;
            content?: string;
            message?: string;
            senderId?: string;
            sender?: { id: string };
            receiverId?: string;
            timestamp?: Date | string;
            created_at?: Date | string;
            type?: string;
            reaction?: string;
            file?: string;
            duration?: number;
          }) => {
            const messageSenderId = msg.senderId || msg.sender?.id || "";
            const isFromMe = messageSenderId === user?.id;
            const conversationId = Array.isArray(id) ? id[0] : id;

            const transformedMessage: Message = {
              id: msg.id,
              content: msg.content || msg.message || "",
              senderId: messageSenderId,
              receiverId:
                msg.receiverId || (isFromMe ? conversationId : user?.id) || "",
              timestamp:
                msg.timestamp || msg.created_at || new Date().toISOString(),
              status: "sent" as const,
              type: msg.type || "TEXT",
              reaction: msg.reaction || "",
              sender: isFromMe ? "me" : "other",
            };

            // Add sender object if available
            if (
              msg.sender &&
              typeof msg.sender === "object" &&
              "id" in msg.sender &&
              "fullName" in msg.sender &&
              "avatar" in msg.sender
            ) {
              transformedMessage.sender = msg.sender as User;
            }

            // Handle voice messages
            if (msg.type === "voice" && msg.file) {
              transformedMessage.voice = {
                uri: msg.file || "",
                duration: msg.duration || 0,
                isPlaying: false,
              };
            }

            // Handle file/video/image messages
            if (
              ["FILE", "VIDEO", "IMAGE", "GIF"].includes(msg.type || "") &&
              msg.file
            ) {
              const fileUrl = msg.file;
              const fileName = fileUrl.split("/").pop() || "file";

              console.log(`Processing message of type ${msg.type}:`, {
                fileUrl,
                fileName,
              });

              // Check filename for GIF extension
              if (fileName.toLowerCase().endsWith(".gif")) {
                transformedMessage.type = "GIF";
                console.log(`Detected GIF from filename: ${fileName}`);
              }

              // Get file extension to determine type
              const extension = fileName.split(".").pop()?.toLowerCase() || "";
              let mimeType = "application/octet-stream";

              // Set mime type based on file extension or message type
              if (msg.type === "VIDEO") {
                mimeType = "video/mp4";
              } else if (msg.type === "IMAGE") {
                mimeType = "image/jpeg";
              } else if (msg.type === "GIF" || extension === "gif") {
                mimeType = "image/gif";
                transformedMessage.type = "GIF"; // Explicitly set type to GIF
                console.log(
                  "Set message type to GIF based on extension or type",
                );
              } else if (extension) {
                // Map common extensions to mime types
                const mimeMap: Record<string, string> = {
                  pdf: "application/pdf",
                  doc: "application/msword",
                  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  xls: "application/vnd.ms-excel",
                  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  ppt: "application/vnd.ms-powerpoint",
                  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                  txt: "text/plain",
                  png: "image/png",
                  jpg: "image/jpeg",
                  jpeg: "image/jpeg",
                  gif: "image/gif",
                  mp4: "video/mp4",
                  mov: "video/quicktime",
                  mp3: "audio/mpeg",
                };
                mimeType = mimeMap[extension] || mimeType;
              }

              // Double check for GIF extensions in the URL
              if (fileUrl.toLowerCase().includes(".gif")) {
                transformedMessage.type = "GIF";
                mimeType = "image/gif";
                console.log(`Found GIF in URL: ${fileUrl}`);
              }

              console.log(
                `Final message type: ${transformedMessage.type}, mimeType: ${mimeType}`,
              );

              transformedMessage.file = {
                url: fileUrl,
                uri: fileUrl,
                name: fileName,
                filename: fileName,
                size: 0, // We don't have this information from API
                type: mimeType,
                mimeType,
              };
            }

            return transformedMessage;
          },
        );

        // Sort messages by timestamp
        const sortedMessages = transformedMessages.sort(
          (a: Message, b: Message) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeA - timeB;
          },
        );

        setMessages(sortedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [id, user?.id]);

  // Function to load more messages
  const loadMoreMessages = async () => {
    if (!pagination.hasMore || isLoadingMore) {
      console.log(
        "Not loading more messages:",
        !pagination.hasMore ? "No more messages to load" : "Already loading",
      );
      return;
    }

    try {
      console.log("Loading more messages from offset:", pagination.offset);
      setIsLoadingMore(true);

      const response = await getMessages(id as string, {
        limit: pagination.limit,
        offset: pagination.offset,
      });

      console.log("API response structure:", Object.keys(response));
      const responseMessages =
        response.messages || response.data?.messages || [];
      const paginationInfo = response.pagination || response.data?.pagination;

      // Update pagination info
      const hasMore =
        !!paginationInfo?.hasMore ||
        responseMessages.length >= pagination.limit;

      setPagination({
        offset: pagination.offset + pagination.limit,
        limit: pagination.limit,
        hasMore,
      });

      // Transform messages to match the expected format
      const transformedMessages = responseMessages.map(
        (msg: {
          id: string;
          content?: string;
          message?: string;
          senderId?: string;
          sender?: { id: string };
          receiverId?: string;
          timestamp?: Date | string;
          created_at?: Date | string;
          type?: string;
          reaction?: string;
          file?: string;
          duration?: number;
        }) => {
          const messageSenderId = msg.senderId || msg.sender?.id || "";
          const isFromMe = messageSenderId === user?.id;
          const conversationId = Array.isArray(id) ? id[0] : id;

          const transformedMessage: Message = {
            id: msg.id,
            content: msg.content || msg.message || "",
            senderId: messageSenderId,
            receiverId:
              msg.receiverId || (isFromMe ? conversationId : user?.id) || "",
            timestamp:
              msg.timestamp || msg.created_at || new Date().toISOString(),
            status: "sent" as const,
            type: msg.type || "TEXT",
            reaction: msg.reaction || "",
            sender: isFromMe ? "me" : "other",
          };

          // Add sender object if available
          if (
            msg.sender &&
            typeof msg.sender === "object" &&
            "id" in msg.sender &&
            "fullName" in msg.sender &&
            "avatar" in msg.sender
          ) {
            transformedMessage.sender = msg.sender as User;
          }

          // Handle voice messages
          if (msg.type === "voice" && msg.file) {
            transformedMessage.voice = {
              uri: msg.file || "",
              duration: msg.duration || 0,
              isPlaying: false,
            };
          }

          // Handle file/video/image messages
          if (
            ["FILE", "VIDEO", "IMAGE", "GIF"].includes(msg.type || "") &&
            msg.file
          ) {
            const fileUrl = msg.file;
            const fileName = fileUrl.split("/").pop() || "file";

            // Check filename for GIF extension
            if (fileName.toLowerCase().endsWith(".gif")) {
              transformedMessage.type = "GIF";
            }

            // Get file extension to determine type
            const extension = fileName.split(".").pop()?.toLowerCase() || "";
            let mimeType = "application/octet-stream";

            // Set mime type based on file extension or message type
            if (msg.type === "VIDEO") {
              mimeType = "video/mp4";
            } else if (msg.type === "IMAGE") {
              mimeType = "image/jpeg";
            } else if (msg.type === "GIF" || extension === "gif") {
              mimeType = "image/gif";
            } else if (extension) {
              // Map common extensions to mime types
              const mimeMap: Record<string, string> = {
                pdf: "application/pdf",
                doc: "application/msword",
                docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                xls: "application/vnd.ms-excel",
                xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ppt: "application/vnd.ms-powerpoint",
                pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                txt: "text/plain",
                png: "image/png",
                jpg: "image/jpeg",
                jpeg: "image/jpeg",
                gif: "image/gif",
                mp4: "video/mp4",
                mov: "video/quicktime",
                mp3: "audio/mpeg",
              };
              mimeType = mimeMap[extension] || mimeType;
            }

            transformedMessage.file = {
              url: fileUrl,
              uri: fileUrl,
              name: fileName,
              filename: fileName,
              size: 0, // We don't have this information from API
              type: mimeType,
              mimeType,
            };
          }

          return transformedMessage;
        },
      );

      // Sort messages by timestamp
      const sortedMessages = transformedMessages.sort(
        (a: Message, b: Message) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeA - timeB;
        },
      );

      // Add older messages to the beginning of the messages array
      setMessages((prevMessages) => {
        // Filter out duplicates based on message ID
        const existingIds = new Set(prevMessages.map((m) => m.id));
        const newMessages = sortedMessages.filter(
          (m: Message) => !existingIds.has(m.id),
        );
        return [...newMessages, ...prevMessages];
      });
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle reaching the top of the scroll view
  const handleScroll = (event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const { contentOffset } = event.nativeEvent;

    // If we're at the top of the scroll view and there are more messages to load
    if (contentOffset.y < 10 && pagination.hasMore && !isLoadingMore) {
      console.log(
        "Reached top, loading more messages. Y position:",
        contentOffset.y,
      );
      loadMoreMessages();
    }
  };

  // Additional handler to catch the end of scrolling momentum
  const handleMomentumScrollEnd = (event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const { contentOffset } = event.nativeEvent;

    // If we're near the top when momentum ends
    if (contentOffset.y < 50 && pagination.hasMore && !isLoadingMore) {
      console.log(
        "Momentum ended near top, loading more. Y position:",
        contentOffset.y,
      );
      loadMoreMessages();
    }
  };

  // Restore scroll position after loading more messages
  useEffect(() => {
    if (!isLoadingMore && flatListRef.current) {
      // When loading more messages completes, we need to adjust the scroll position
      // to prevent the view from jumping
      // This will run after the new messages are rendered
      setTimeout(() => {
        if (flatListRef.current) {
          // Use scrollToOffset for FlatList instead of scrollTo
          flatListRef.current.scrollToOffset({ offset: 50, animated: false });
        }
      }, 100);
    }
  }, [isLoadingMore]);

  // Listen for new messages from socket
  useEffect(() => {
    const chatMessages = socketMessages[id as string];
    if (chatMessages && Array.isArray(chatMessages)) {
      // Transform socket messages to match our format
      const transformedMessages = chatMessages.map(
        (msg: {
          id: string;
          content?: string;
          message?: string;
          senderId?: string;
          sender?: { id: string };
          receiverId?: string;
          timestamp?: Date | string;
          created_at?: Date | string;
          type?: string;
          reaction?: string;
          file?: string;
          duration?: number;
        }) => {
          const messageSenderId = msg.senderId || msg.sender?.id || "";
          const isFromMe = messageSenderId === user?.id;
          const conversationId = Array.isArray(id) ? id[0] : id;

          const transformedMessage: Message = {
            id: msg.id,
            content: msg.content || msg.message || "",
            senderId: messageSenderId,
            receiverId:
              msg.receiverId || (isFromMe ? conversationId : user?.id) || "",
            timestamp:
              msg.timestamp || msg.created_at || new Date().toISOString(),
            status: "sent" as const,
            type: msg.type || "TEXT",
            reaction: msg.reaction || "",
            sender: isFromMe ? "me" : "other",
          };

          // Add sender object if available
          if (
            msg.sender &&
            typeof msg.sender === "object" &&
            "id" in msg.sender &&
            "fullName" in msg.sender &&
            "avatar" in msg.sender
          ) {
            transformedMessage.sender = msg.sender as User;
          }

          // Handle voice messages
          if (msg.type === "voice" && msg.file) {
            transformedMessage.voice = {
              uri: msg.file || "",
              duration: msg.duration || 0,
              isPlaying: false,
            };
          }

          // Handle file/video/image messages
          if (
            ["FILE", "VIDEO", "IMAGE", "GIF"].includes(msg.type || "") &&
            msg.file
          ) {
            const fileUrl = msg.file;
            const fileName = fileUrl.split("/").pop() || "file";

            // Check filename for GIF extension
            if (fileName.toLowerCase().endsWith(".gif")) {
              transformedMessage.type = "GIF";
            }

            // Get file extension to determine type
            const extension = fileName.split(".").pop()?.toLowerCase() || "";
            let mimeType = "application/octet-stream";

            // Set mime type based on file extension or message type
            if (msg.type === "VIDEO") {
              mimeType = "video/mp4";
            } else if (msg.type === "IMAGE") {
              mimeType = "image/jpeg";
            } else if (msg.type === "GIF" || extension === "gif") {
              mimeType = "image/gif";
            } else if (extension) {
              // Map common extensions to mime types
              const mimeMap: Record<string, string> = {
                pdf: "application/pdf",
                doc: "application/msword",
                docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                xls: "application/vnd.ms-excel",
                xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ppt: "application/vnd.ms-powerpoint",
                pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                txt: "text/plain",
                png: "image/png",
                jpg: "image/jpeg",
                jpeg: "image/jpeg",
                gif: "image/gif",
                mp4: "video/mp4",
                mov: "video/quicktime",
                mp3: "audio/mpeg",
              };
              mimeType = mimeMap[extension] || mimeType;
            }

            transformedMessage.file = {
              url: fileUrl,
              uri: fileUrl,
              name: fileName,
              filename: fileName,
              size: 0, // We don't have this information from API
              type: mimeType,
              mimeType,
            };
          }

          return transformedMessage;
        },
      );

      // Merge with existing messages, avoiding duplicates and sorting by timestamp
      setMessages((prevMessages) => {
        const existingIds = new Set(prevMessages.map((m) => m.id));
        const newMessages = transformedMessages.filter(
          (m) => !existingIds.has(m.id),
        );
        const allMessages = [...prevMessages, ...newMessages];

        // Sort all messages by timestamp
        return allMessages.sort((a: Message, b: Message) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeA - timeB;
        });
      });
    }
  }, [socketMessages, id, user?.id]);

  // Generate waveform if not already generated for this message
  const getWaveform = (messageId: string) => {
    if (!waveforms[messageId]) {
      waveforms[messageId] = Array.from(
        { length: 30 },
        () => Math.random() * 0.8 + 0.2,
      );
    }
    return waveforms[messageId];
  };

  // Get animated values for this message's waveform
  const getAnimatedValues = (messageId: string, barCount: number) => {
    if (!animatedValues[messageId]) {
      animatedValues[messageId] = Array.from(
        { length: barCount },
        () => new Animated.Value(0),
      );
    }
    return animatedValues[messageId];
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSend = async () => {
    if (message.trim()) {
      try {
        const conversationId = Array.isArray(id) ? id[0] : id;

        // Create a temporary message for immediate display
        const tempMessage: Message = {
          id: Date.now().toString(),
          content: message,
          senderId: user?.id || "",
          receiverId: conversationId,
          timestamp: new Date().toISOString(),
          status: "sent",
          type: "TEXT",
          reaction: "",
          sender: "me",
        };

        // Add to local state immediately
        setMessages((prev) => [...prev, tempMessage]);
        scrollToBottom();

        // Send message through socket for real-time update
        sendSocketMessage(conversationId, message);

        // Also send through API for persistence
        await sendMessage({
          conversationId,
          content: message,
          type: "TEXT",
        });

        setMessage("");

        // Clear reply mode if active
        if (replyingTo) {
          setReplyingTo(null);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleSendVoice = async (uri: string, duration: number) => {
    try {
      const conversationId = Array.isArray(id) ? id[0] : id;

      // Send voice message through socket
      sendSocketMessage(
        conversationId,
        JSON.stringify({ type: "voice", uri, duration }),
      );

      // Also send through API for persistence
      await sendMessage({
        conversationId,
        content: "",
        type: "voice",
        file: uri,
      });

      // Add to local state immediately
      const newMessage: Message = {
        id: Date.now().toString(),
        content: "",
        senderId: user?.id || "",
        receiverId: conversationId,
        timestamp: new Date().toISOString(),
        status: "sent",
        type: "voice",
        reaction: "",
        voice: {
          uri,
          duration,
          isPlaying: false,
        },
        sender: "me",
      };

      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending voice message:", error);
    }
  };

  const handleReaction = (messageId: string, reaction: Reaction) => {
    setMessages(
      messages.map((msg) =>
        msg.id === messageId ? { ...msg, reaction } : msg,
      ),
    );
  };

  const handleReply = (msg: ExtendedMessage) => {
    setReplyingTo(msg);
  };

  // Play/pause voice message
  const handlePlayVoice = async (messageId: string, uri: string) => {
    try {
      // Stop any currently playing audio and clear interval
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;

        if (playbackUpdateInterval.current) {
          clearInterval(playbackUpdateInterval.current);
          playbackUpdateInterval.current = null;
        }
      }

      // If we were already playing this message, just stop it
      if (currentlyPlaying === messageId) {
        setCurrentlyPlaying(null);
        setPlaybackProgress(0);
        setMessages(
          messages.map((msg) =>
            msg.id === messageId && msg.voice
              ? { ...msg, voice: { ...msg.voice, isPlaying: false } }
              : msg,
          ),
        );
        return;
      }

      // Set audio mode to use loudspeaker
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false, // Force loudspeaker for Android
      });

      // Load and play the new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      setCurrentlyPlaying(messageId);
      setPlaybackProgress(0);

      // Update message state to show playing
      setMessages(
        messages.map((msg) =>
          msg.id === messageId && msg.voice
            ? { ...msg, voice: { ...msg.voice, isPlaying: true } }
            : msg,
        ),
      );

      // Set up interval to update playback progress
      playbackUpdateInterval.current = setInterval(async () => {
        if (soundRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            const progress =
              (status.positionMillis / status.durationMillis!) * 100;
            setPlaybackProgress(progress);
          }
        }
      }, 100);

      // When sound finishes playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setCurrentlyPlaying(null);
          setPlaybackProgress(0);

          if (playbackUpdateInterval.current) {
            clearInterval(playbackUpdateInterval.current);
            playbackUpdateInterval.current = null;
          }

          setMessages(
            messages.map((msg) =>
              msg.id === messageId && msg.voice
                ? { ...msg, voice: { ...msg.voice, isPlaying: false } }
                : msg,
            ),
          );
        }
      });
    } catch (error) {
      console.error("Error playing voice message:", error);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Animation handling for progress updates
  useEffect(() => {
    if (currentlyPlaying && playbackProgress > 0) {
      const highlightIndex = Math.floor((30 * playbackProgress) / 100);
      const messageAnimations = animatedValues[currentlyPlaying];

      if (messageAnimations) {
        // Animate all bars that need to change state
        messageAnimations.forEach((anim, index) => {
          Animated.timing(anim, {
            toValue: index <= highlightIndex ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
          }).start();
        });
      }
    }
  }, [playbackProgress, currentlyPlaying]);

  // Render voice message
  const renderVoiceMessage = (msg: ExtendedMessage) => {
    if (!msg.voice) return null;

    const { uri, duration, isPlaying } = msg.voice;
    const isSender = msg.sender === "me";
    const progress = currentlyPlaying === msg.id ? playbackProgress : 0;

    // Get waveform for this message
    const waveformBars = getWaveform(msg.id);

    // Get/create animated values for this message
    const barAnimations = getAnimatedValues(msg.id, waveformBars.length);

    return (
      <View className={`${isSender ? "items-end" : "items-start"} w-full`}>
        <TouchableOpacity
          onPress={() => handlePlayVoice(msg.id, uri)}
          className={`flex-row items-center p-3 rounded-2xl ${
            isSender ? "bg-blue-500" : "bg-white border border-gray-200"
          } ${isSender ? "rounded-tr-none" : "rounded-tl-none"} w-60 overflow-hidden`}
        >
          <View
            className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
              isSender ? "bg-blue-400" : "bg-gray-100"
            }`}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={16}
              color={isSender ? "white" : "#666"}
            />
          </View>
          <View className="flex-1">
            {/* Waveform visualization */}
            <View className="h-7 flex-row items-center justify-between w-full px-0.5 py-1">
              {waveformBars.map((height, index) => {
                // Use animated interpolation for color transition
                const backgroundColor = barAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    isSender ? "#60a5fa" : "#e5e7eb",
                    isSender ? "#ffffff" : "#3b82f6",
                  ],
                });

                return (
                  <Animated.View
                    key={index}
                    style={{
                      height: `${Math.max(15, height * 75)}%`,
                      backgroundColor,
                      width: `${75 / waveformBars.length}%`,
                      borderRadius: 4,
                      marginHorizontal: 1,
                    }}
                  />
                );
              })}
            </View>
            <Text
              className={`text-xs mt-1 ${
                isSender ? "text-white/80" : "text-gray-500"
              }`}
            >
              {formatTime(duration)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSendFile = () => {
    console.log("File sending functionality needs to be implemented");
    // TODO: Implement after installing expo-document-picker and expo-file-system
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop any playing audio and clear intervals on unmount
      if (soundRef.current) {
        soundRef.current
          .stopAsync()
          .then(() => {
            soundRef.current?.unloadAsync();
          })
          .catch(console.error);
      }

      if (playbackUpdateInterval.current) {
        clearInterval(playbackUpdateInterval.current);
      }
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ChatHeader name="Đông Nhi" isStranger />

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Using FlatList for more reliable infinite scrolling */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          ref={flatListRef}
          className="flex-1 bg-gray-50"
          contentContainerStyle={{ padding: 16 }}
          inverted={false} // Set to true to invert the list if needed
          onEndReachedThreshold={0.1}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={
            pagination.hasMore ? (
              <TouchableOpacity
                onPress={loadMoreMessages}
                disabled={isLoadingMore}
                className="items-center justify-center py-2 mb-4"
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="arrow-up" size={16} color="#3b82f6" />
                    <Text className="text-blue-500 ml-1">
                      Load previous messages
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item: msg }) => {
            // Check if it might be a GIF by URL
            if (
              msg.file &&
              typeof msg.file === "string" &&
              msg.file.toLowerCase().includes(".gif")
            ) {
              console.log("Detected GIF in render function:", msg.file);
              // Force the message type to GIF for proper rendering
              msg.type = "GIF";
            }

            return (
              <View className="mb-4">
                {msg.type === "voice" || msg.voice ? (
                  renderVoiceMessage(msg)
                ) : (
                  <ChatBubble
                    message={msg}
                    onReaction={handleReaction}
                    onReply={handleReply}
                    currentUserId={user?.id}
                  />
                )}
              </View>
            );
          }}
        />

        <ChatInput
          message={message}
          onMessageChange={setMessage}
          onSend={handleSend}
          onSendVoice={handleSendVoice}
          onSendFile={handleSendFile}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
