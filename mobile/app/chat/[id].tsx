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

import { getConversationById } from "~/api/apiConversation";
import { getMessages, sendMessage } from "~/api/apiMessage";
import ChatBubble from "~/components/chat/ChatBubble";
import ChatHeader from "~/components/chat/ChatHeader";
import ChatInput from "~/components/chat/ChatInput";
import { Message, Reaction, User } from "~/components/chat/types";
import { useAuth } from "~/contexts/AuthContext";
import { useSocket } from "~/hooks/useSocket";
import { socketService } from "~/lib/socket";
import { useSocketStore } from "~/store/socketStore";
import { useUserStore } from "~/store/userStore";

// Extended message type that includes voice properties
type ExtendedMessage = Message & {
  voice?: {
    uri: string;
    duration: number;
    isPlaying: boolean;
  };
};

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
  const {
    messages: socketMessages = {},
    addMessage: addSocketMessage,
    isConnected: socketConnected,
  } = useSocketStore();

  // Initialize socket connection
  const { sendMessage: sendSocketMessage, joinConversation } = useSocket(
    token || "",
  );

  // Store generated waveforms per message
  const [waveforms] = useState<Record<string, number[]>>({});

  // Store animated values for waveform bars
  const [animatedValues, setAnimatedValues] = useState<
    Record<string, Animated.Value[]>
  >({});

  // Add state for conversation details including type and receiver ID
  const [conversation, setConversation] = useState<{
    id: string;
    type: string;
    receiverId?: string;
    name?: string;
  }>({ id: Array.isArray(id) ? id[0] : (id as string), type: "PRIVATE" });

  // Watch for changes in the socketMessages and update local state
  useEffect(() => {
    if (!id || !socketMessages) return;

    const conversationId = Array.isArray(id) ? id[0] : id;
    const chatMessages = socketMessages[conversationId];

    if (!chatMessages || chatMessages.length === 0) return;

    console.log(
      `[Chat] Processing ${chatMessages.length} messages from socketStore for chat ${conversationId}`,
    );

    // Add new messages that aren't already in the local state
    setMessages((prevMessages) => {
      // Create a map of existing message IDs for faster lookup
      const existingMessageIds = new Set(prevMessages.map((m) => m.id));

      // Filter out messages that already exist in the current state
      const newMessages = chatMessages.filter(
        (msg) => !existingMessageIds.has(msg.id),
      );

      if (newMessages.length === 0) {
        console.log("[Chat] No new messages to add from socket store");
        return prevMessages;
      }

      console.log(
        `[Chat] Adding ${newMessages.length} new messages from socket store`,
      );

      // Combine and sort all messages by timestamp
      const allMessages = [...prevMessages, ...newMessages].sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      return allMessages;
    });
  }, [id, socketMessages]);

  // Fetch conversation details to determine if it's a private or group chat
  useEffect(() => {
    if (!id || !token) return;

    const fetchConversationDetails = async () => {
      try {
        const conversationId = Array.isArray(id) ? id[0] : id;
        const response = await getConversationById(conversationId);
        const conversationData = response.data || {};

        console.log(
          `[Chat] Conversation API response:`,
          JSON.stringify({
            id: conversationData.id,
            type: conversationData.type,
            memberCount: conversationData.members?.length || 0,
          }),
        );

        // If type is PRIVATE, find the other user's ID to use as receiverId
        let receiverId;
        if (
          conversationData.type === "PRIVATE" &&
          Array.isArray(conversationData.members)
        ) {
          const otherMember = conversationData.members.find(
            (member: any) => member.id !== user?.id,
          );
          receiverId = otherMember?.id;
          console.log(
            `[Chat] Found receiverId for private conversation: ${receiverId}`,
          );
        }

        // For 1:1 chats, we MUST have a receiverId for proper API calls
        if (conversationData.members?.length === 2 && !receiverId && user?.id) {
          // Backup logic - if we have 2 members, the receiverId is the one that's not the current user
          const possibleMembers = conversationData.members
            .map((m: any) => m.id)
            .filter((id: string) => id !== user.id);
          if (possibleMembers.length === 1) {
            receiverId = possibleMembers[0];
            console.log(
              `[Chat] Used backup logic to find receiverId: ${receiverId}`,
            );
          }
        }

        setConversation({
          id: conversationId,
          type: conversationData.type || "PRIVATE",
          receiverId,
          name: conversationData.name,
        });

        console.log(
          `[Chat] Conversation details loaded - type: ${conversationData.type}, members: ${conversationData.members?.length}`,
        );
      } catch (error) {
        console.error("[Chat] Error fetching conversation details:", error);
        // Default to PRIVATE as fallback
        setConversation({
          id: Array.isArray(id) ? id[0] : (id as string),
          type: "PRIVATE",
        });
      }
    };

    fetchConversationDetails();
  }, [id, token, user?.id]);

  // Join the conversation room when the chat loads
  useEffect(() => {
    if (!id || !token) return;

    const conversationId = Array.isArray(id) ? id[0] : id;
    console.log(`[Chat] Explicitly joining conversation: ${conversationId}`);

    // Force socket connection if needed
    if (!socketService.isConnected()) {
      console.log(
        "[Chat] Socket not connected, attempting to connect and join conversation",
      );
      // Small delay to ensure the connection has time to establish
      setTimeout(() => {
        joinConversation(conversationId);
      }, 500);
    } else {
      // Make sure to call joinConversation when the chat screen loads
      joinConversation(conversationId);
    }

    // Also automatically join when socket reconnects
    const handleReconnect = () => {
      console.log(
        `[Chat] Socket reconnected, rejoining conversation: ${conversationId}`,
      );
      joinConversation(conversationId);
    };

    // Listen for socket reconnection
    socketService.on("reconnect", handleReconnect);

    return () => {
      socketService.off("reconnect");
    };
  }, [id, token, joinConversation]);

  // Fetch initial messages
  useEffect(() => {
    if (!id) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        console.log(`[Chat] Fetching messages for conversation: ${id}`);
        const conversationId = Array.isArray(id) ? id[0] : id;

        const response = await getMessages(conversationId, {
          limit: 50,
          offset: 0,
          sort: "desc", // Keep desc order for inverted list
        });

        console.log(
          `[Chat] API returned ${response.messages?.length || 0} messages`,
        );

        if (!response.messages || response.messages.length === 0) {
          console.log(`[Chat] No messages returned from API`);
          setMessages([]);
          setIsLoading(false);
          return;
        }

        // Log the timestamps to debug ordering issues
        if (response.messages.length > 0) {
          const firstMsg = response.messages[0];
          const lastMsg = response.messages[response.messages.length - 1];
          console.log(
            `[Chat] First message timestamp: ${firstMsg.timestamp || firstMsg.created_at}`,
          );
          console.log(
            `[Chat] Last message timestamp: ${lastMsg.timestamp || lastMsg.created_at}`,
          );
        }

        const responseMessages = response.messages || [];
        setPagination({
          offset: response.pagination?.offset || 0,
          limit: response.pagination?.limit || 20,
          hasMore: response.pagination?.hasMore || false,
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

        // Don't reverse the messages since we're using inverted list
        const sortedMessages = transformedMessages;

        console.log(
          `[Chat] Processed ${sortedMessages.length} messages, latest timestamp: ${
            sortedMessages.length > 0
              ? new Date(
                  sortedMessages[sortedMessages.length - 1].timestamp,
                ).toISOString()
              : "none"
          }`,
        );

        setMessages(sortedMessages);

        // Scroll to bottom after messages are loaded and rendered
        setTimeout(() => {
          scrollToBottom(false);
        }, 300); // Add a delay to ensure messages are rendered
      } catch (error) {
        console.error("[Chat] Error fetching messages:", error);
        setMessages([]);
      } finally {
        setIsLoading(false);

        // After loading initial messages, check if we should join the conversation
        if (socketService.isConnected()) {
          const conversationId = Array.isArray(id) ? id[0] : id;
          console.log(
            `[Chat] Joining conversation after loading messages: ${conversationId}`,
          );
          socketService.joinConversation(conversationId);
        }
      }
    };

    fetchMessages();
  }, [id, user?.id]);

  // Add debug useEffect to monitor the messages array
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      console.log(
        `[Chat] Current messages state has ${messages.length} messages, latest:`,
        {
          id: latestMessage.id,
          content: latestMessage.content,
          timestamp: latestMessage.timestamp,
          formattedTime: new Date(latestMessage.timestamp).toLocaleTimeString(),
        },
      );
    } else {
      console.log(`[Chat] No messages in current state`);
    }
  }, [messages]);

  // Regularly attempt to reconnect and join conversation if socket disconnects
  useEffect(() => {
    if (!id || !token) return;

    const conversationId = Array.isArray(id) ? id[0] : id;

    // Check connection status every 10 seconds and rejoin if needed
    const intervalId = setInterval(() => {
      if (!socketService.isConnected()) {
        console.log(
          "[Chat] Socket connection check: not connected. Attempting to rejoin conversation.",
        );
        setTimeout(() => {
          joinConversation(conversationId);
        }, 500);
      }
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [id, token, joinConversation]);

  // Function to load more messages
  const loadMoreMessages = async () => {
    if (!pagination.hasMore || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const response = await getMessages(id as string, {
        limit: pagination.limit,
        offset: pagination.offset,
        sort: "desc", // Keep desc order for inverted list
      });

      const responseMessages = response.messages || [];

      // Update pagination
      setPagination({
        offset: pagination.offset + pagination.limit,
        limit: pagination.limit,
        hasMore: responseMessages.length >= pagination.limit,
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

      setMessages((prevMessages) => {
        const existingIds = new Set(prevMessages.map((m) => m.id));
        const newMessages = transformedMessages.filter(
          (m: Message) => !existingIds.has(m.id),
        );
        return [...prevMessages, ...newMessages];
      });
    } catch (error) {
      console.error("[Chat] Error loading more messages:", error);
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

  // Instead of relying on the useEffect hook for socket messages, we'll modify the direct message handler
  // to ensure immediate updates to the UI
  useEffect(() => {
    if (!token || !id) return;

    console.log("[Chat] Setting up direct socket listeners for chat:", id);
    const conversationId = Array.isArray(id) ? id[0] : id;

    // Listen for direct new_message events to bypass the store
    const handleNewMessage = (data: any) => {
      console.log("[Chat] Direct new_message handler received:", data);

      // Ensure the message has an ID
      if (!data.id) {
        data.id = Date.now().toString();
        console.log("[Chat] Added missing ID to message:", data.id);
      }

      // Check if this message belongs to the current chat
      let belongsToCurrentChat = false;
      const { senderId, receiverId } = data;

      // Case 1: Message has conversationId that matches current conversation
      if (data.conversationId && data.conversationId === conversationId) {
        belongsToCurrentChat = true;
        console.log(
          "[Chat] Message belongs to current conversation by conversationId",
        );
      }
      // Case 2: Direct message between current user and another user
      else if (
        !data.conversationId &&
        (senderId === user?.id || receiverId === user?.id)
      ) {
        // For direct messages, the other party should be in the current conversation
        const otherPartyId = senderId === user?.id ? receiverId : senderId;
        if (otherPartyId === conversation.receiverId) {
          belongsToCurrentChat = true;
          console.log(
            "[Chat] Message belongs to current conversation as direct message",
          );
        }
      }

      if (!belongsToCurrentChat) {
        console.log("[Chat] Message does not belong to current chat, skipping");
        return;
      }

      // Use same transformation logic as in the socketMessages effect
      const messageSenderId =
        data.senderId ||
        (data.sender && typeof data.sender === "object" ? data.sender.id : "");
      const isFromMe = messageSenderId === user?.id;

      const transformedMessage: any = {
        id: data.id,
        content: data.content || data.message || "",
        senderId: messageSenderId,
        receiverId:
          data.receiverId || (isFromMe ? conversationId : user?.id) || "",
        timestamp: data.timestamp || new Date().toISOString(),
        status: "sent" as const,
        type: (data.type as any) || "TEXT",
        sender: isFromMe ? "me" : "other",
      };

      // If there's a reaction, add it
      if (data.reaction) {
        transformedMessage.reaction = data.reaction;
      }

      // Handle file if present
      if (data.file) {
        transformedMessage.file = {
          url: data.file,
          uri: data.file,
          type: data.fileType || "application/octet-stream",
          name: data.fileName || "file",
        };
      }

      console.log("[Chat] Adding message to UI:", transformedMessage);

      // Check if this message already exists
      setMessages((prevMessages) => {
        // Skip if message already exists
        const messageExists = prevMessages.some(
          (m) => m.id === transformedMessage.id,
        );
        if (messageExists) {
          console.log("[Chat] Message already exists in state, skipping");
          return prevMessages;
        }

        console.log("[Chat] Adding new message to state");

        // Add the new message and sort all messages by timestamp
        const newMessages = [...prevMessages, transformedMessage].sort(
          (a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
          },
        );

        // Force a scroll to bottom after updating messages
        setTimeout(() => scrollToBottom(), 100);

        return newMessages;
      });
    };

    // Set up socket listeners
    socketService.on("new_message", handleNewMessage);
    socketService.on("chat message", handleNewMessage);

    return () => {
      socketService.off("new_message");
      socketService.off("chat message");
    };
  }, [id, user?.id, token, conversation.receiverId]);

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

  const scrollToBottom = (animated = true) => {
    if (flatListRef.current) {
      console.log("[Chat] Scrolling to bottom of messages");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated });
      }, 100);
    }
  };

  // We need to also modify the send function to make sure we see our own messages immediately
  const handleSend = async () => {
    if (message.trim()) {
      try {
        const conversationId = Array.isArray(id) ? id[0] : id;
        const messageText = message.trim();

        // Create a temporary message for immediate display
        const tempMessage: any = {
          id: Date.now().toString(),
          content: messageText,
          senderId: user?.id || "",
          receiverId: conversation.receiverId || conversationId,
          timestamp: new Date().toISOString(),
          status: "sent",
          type: "TEXT",
          reaction: "",
          sender: "me",
        };

        // Clear input immediately to improve UX responsiveness
        setMessage("");

        // Add to local state immediately
        setMessages((prev) => {
          const newMessages = [...prev, tempMessage];
          return newMessages;
        });

        // Scroll to bottom immediately
        scrollToBottom();

        console.log(
          `[Chat] Sending message. Conversation type: ${conversation.type}, receiverId: ${conversation.receiverId}`,
        );

        // Try socket send first if connected (real-time update)
        let socketSent = false;
        if (socketService.isConnected()) {
          console.log("[Chat] Sending message via socket");
          socketSent = sendSocketMessage(conversationId, messageText);

          if (socketSent) {
            console.log("[Chat] Message sent successfully via socket");
          } else {
            console.log("[Chat] Failed to send via socket, will use API");
          }
        } else {
          console.log("[Chat] Socket not connected, will use API only");
        }

        // Always use API for persistence since socket is unreliable
        try {
          if (conversation.receiverId) {
            console.log(
              `[Chat] Using private message API with receiverId: ${conversation.receiverId}`,
            );
            // Use private message API
            await sendMessage({
              conversationId,
              content: messageText,
              receiverId: conversation.receiverId,
              type: "TEXT",
            });
            console.log("[Chat] Message sent via private API");
          } else {
            // Last resort - use group API
            console.log(
              `[Chat] Using group message API as fallback for: ${conversationId}`,
            );
            await sendMessage({
              conversationId,
              content: messageText,
              type: "TEXT",
            });
            console.log("[Chat] Message sent via group API");
          }
        } catch (apiError) {
          console.error("[Chat] API send error:", apiError);

          // If API fails and socket didn't send, we have a complete failure
          if (!socketSent) {
            console.error("[Chat] Both API and socket failed to send message");
            // Could show a toast or notification here about message failure
          }
        }

        // Clear reply mode if active
        if (replyingTo) {
          setReplyingTo(null);
        }
      } catch (error) {
        console.error("[Chat] Error sending message:", error);
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

  // Watch socket connection status
  useEffect(() => {
    const conversationId = Array.isArray(id) ? id[0] : id;

    console.log(
      `[Chat] Socket connected status changed to: ${socketConnected}`,
    );

    if (socketConnected) {
      console.log(`[Chat] Socket connected, joining room: ${conversationId}`);
      joinConversation(conversationId);
    }
  }, [socketConnected, id, joinConversation]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ChatHeader name="Đông Nhi" isStranger />

      {/* Debug component to show message count - can remove this later */}
      <View className="px-2 py-1 bg-gray-200">
        <Text className="text-xs text-gray-700">
          Messages: {messages.length} | Socket Connected:{" "}
          {socketConnected ? "Yes" : "No"} | Socket Messages:{" "}
          {socketMessages[Array.isArray(id) ? id[0] : (id as string)]?.length ||
            0}
        </Text>
      </View>

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
          contentContainerStyle={{
            padding: 16,
            flexGrow: 1,
            justifyContent: "flex-end",
          }}
          inverted
          onEndReachedThreshold={0.1}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          ListFooterComponent={
            pagination.hasMore ? (
              <TouchableOpacity
                onPress={loadMoreMessages}
                disabled={isLoadingMore}
                className="items-center justify-center py-2 mt-4"
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="arrow-down" size={16} color="#3b82f6" />
                    <Text className="text-blue-500 ml-1">
                      Load previous messages
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item: msg }) => {
            if (
              msg.file &&
              typeof msg.file === "string" &&
              msg.file.toLowerCase().includes(".gif")
            ) {
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
