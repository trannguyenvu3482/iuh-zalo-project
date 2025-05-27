import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { useSocket } from "~/hooks/useSocket";
import { socketService } from "~/lib/socket";
import { useSocketStore } from "~/store/socketStore";
import { useUserStore } from "~/store/userStore";

export default function Chat() {
  const { id } = useLocalSearchParams();
  const { user, token } = useUserStore();
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

  // Socket store and connection
  const { messages: socketMessages = {}, isConnected: socketConnected } =
    useSocketStore();
  const { sendMessage: sendSocketMessage, joinConversation } = useSocket();

  // Conversation details
  const [conversation, setConversation] = useState<{
    id: string;
    type: string;
    receiverId?: string;
    name?: string;
    members?: any[];
  }>({ id: Array.isArray(id) ? id[0] : (id as string), type: "PRIVATE" });

  // Track processed messages to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set());
  const sentMessageTracker = useRef<
    Map<string, { content: string; timestamp: number }>
  >(new Map());

  // Transform API message to local format
  const transformMessage = (msg: any): Message => {
    const messageSenderId = msg.senderId || msg.sender?.id || "";
    const isFromMe = messageSenderId === user?.id;
    const conversationId = Array.isArray(id) ? id[0] : id;

    const transformedMessage: Message = {
      id: msg.id,
      content: msg.content || msg.message || "",
      senderId: messageSenderId,
      receiverId:
        msg.receiverId || (isFromMe ? conversationId : user?.id) || "",
      timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
      status: "sent" as const,
      type: msg.type || "TEXT",
      reaction: msg.reaction || "",
      sender: isFromMe ? "me" : "other",
    };

    // Add sender object if available
    if (msg.sender && typeof msg.sender === "object" && "id" in msg.sender) {
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

    // Handle file messages
    if (
      ["FILE", "VIDEO", "IMAGE", "GIF"].includes(msg.type || "") &&
      msg.file
    ) {
      const fileUrl = msg.file;
      const fileName = fileUrl.split("/").pop() || "file";
      const extension = fileName.split(".").pop()?.toLowerCase() || "";

      // Determine mime type
      const mimeMap: Record<string, string> = {
        pdf: "application/pdf",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        mp4: "video/mp4",
        mp3: "audio/mpeg",
      };
      const mimeType = mimeMap[extension] || "application/octet-stream";

      // Set GIF type if needed
      if (extension === "gif" || fileUrl.toLowerCase().includes(".gif")) {
        transformedMessage.type = "GIF";
      }

      transformedMessage.file = {
        url: fileUrl,
        uri: fileUrl,
        name: fileName,
        filename: fileName,
        size: 0,
        type: mimeType,
        mimeType,
      };
    }

    return transformedMessage;
  };

  // Fetch conversation details
  useEffect(() => {
    if (!id || !token) return;

    const fetchConversationDetails = async () => {
      try {
        const conversationId = Array.isArray(id) ? id[0] : id;
        const response = await getConversationById(conversationId);
        const conversationData = response || {};
        const members = conversationData.members || [];

        // Find receiver ID for private conversations
        let receiverId;
        if (Array.isArray(members)) {
          const otherMember = members.find(
            (member: any) => member.id !== user?.id,
          );
          if (otherMember) {
            receiverId = otherMember.id;
          }
        }

        setConversation({
          id: conversationId,
          type: conversationData.type || "PRIVATE",
          receiverId,
          name: conversationData.name,
          members,
        });
      } catch (error) {
        console.error("Error fetching conversation details:", error);
        setConversation({
          id: Array.isArray(id) ? id[0] : (id as string),
          type: "PRIVATE",
        });
      }
    };

    fetchConversationDetails();
  }, [id, token, user?.id]);

  // Join conversation room
  useEffect(() => {
    if (!id || !token) return;

    const conversationId = Array.isArray(id) ? id[0] : id;

    if (socketService.isSocketConnected()) {
      joinConversation(conversationId);
    } else {
      setTimeout(() => joinConversation(conversationId), 500);
    }

    const handleReconnect = () => joinConversation(conversationId);
    socketService.on("reconnect", handleReconnect);

    return () => socketService.off("reconnect");
  }, [id, token, joinConversation]);

  // Fetch initial messages
  useEffect(() => {
    if (!id) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const conversationId = Array.isArray(id) ? id[0] : id;
        const response = await getMessages(conversationId, {
          limit: 50,
          offset: 0,
          sort: "desc",
        });

        if (!response.messages || response.messages.length === 0) {
          setMessages([]);
          setIsLoading(false);
          return;
        }

        const transformedMessages = response.messages.map(transformMessage);

        setPagination({
          offset: response.pagination?.offset || 0,
          limit: response.pagination?.limit || 20,
          hasMore: response.pagination?.hasMore || false,
        });

        setMessages(transformedMessages);
        setTimeout(() => scrollToBottom(false), 300);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [id, user?.id]);

  // Handle socket messages from store - skip own messages for group chats to prevent duplication
  useEffect(() => {
    if (!id || !socketMessages) return;

    const conversationId = Array.isArray(id) ? id[0] : id;
    const chatMessages = socketMessages[conversationId];

    if (!chatMessages || chatMessages.length === 0) return;

    setMessages((prevMessages) => {
      const existingMessageIds = new Set(prevMessages.map((m) => m.id));
      const processedIds = processedMessageIds.current;
      const newMessages = chatMessages.filter((msg) => {
        if (processedIds.has(msg.id) || existingMessageIds.has(msg.id)) {
          return false;
        } // Skip own messages for GROUP conversations to prevent duplication
        // For PRIVATE conversations, only skip if message matches recent sent messages
        const senderId = msg.senderId || msg.sender?.id;
        if (senderId === user?.id) {
          // ALWAYS skip own messages in GROUP chats to prevent duplication
          if (conversation.type === "GROUP") {
            console.log(
              "[Chat] Skipping own message in group chat to prevent duplication",
            );
            processedIds.add(msg.id);
            return false;
          }
          // For PRIVATE chats, skip only if it matches a recently sent message
          else if (conversation.type === "PRIVATE") {
            const content = msg.content || "";
            for (const [, trackedMsg] of sentMessageTracker.current.entries()) {
              if (
                trackedMsg.content === content &&
                Date.now() - trackedMsg.timestamp < 10000
              ) {
                processedIds.add(msg.id);
                return false;
              }
            }
          }
        }

        processedIds.add(msg.id);
        return true;
      });

      if (newMessages.length === 0) return prevMessages;

      const allMessages = [...prevMessages, ...newMessages].sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      return allMessages;
    });
  }, [id, socketMessages, user?.id, conversation.type]);
  // Load more messages
  const loadMoreMessages = async () => {
    if (!pagination.hasMore || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const response = await getMessages(id as string, {
        limit: pagination.limit,
        offset: pagination.offset,
      });

      const responseMessages = response.messages || [];
      setPagination({
        offset: pagination.offset + pagination.limit,
        limit: pagination.limit,
        hasMore: responseMessages.length >= pagination.limit,
      });

      const transformedMessages = responseMessages.map(transformMessage);
      const sortedMessages = transformedMessages.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      setMessages((prevMessages) => {
        const existingIds = new Set(prevMessages.map((m) => m.id));
        const newMessages = sortedMessages.filter(
          (m) => !existingIds.has(m.id),
        );
        return [...newMessages, ...prevMessages];
      });
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const scrollToBottom = (animated = true) => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated });
      }, 100);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const conversationId = Array.isArray(id) ? id[0] : id;
      const messageText = message.trim();
      const tempId = `temp-${Date.now()}`;

      // Track message to prevent duplicates
      sentMessageTracker.current.set(tempId, {
        content: messageText,
        timestamp: Date.now(),
      });

      // Clean up tracker after 10 seconds
      setTimeout(() => sentMessageTracker.current.delete(tempId), 10000);

      // Create temporary message for immediate display
      const tempMessage: Message = {
        id: tempId,
        content: messageText,
        senderId: user?.id || "",
        timestamp: new Date().toISOString(),
        status: "sent",
        type: "TEXT",
        reaction: "",
        sender: "me",
        isTemporary: true,
      } as any;

      setMessage("");
      setMessages((prev) => [...prev, tempMessage]);
      processedMessageIds.current.add(tempId);
      scrollToBottom();

      // Send via socket if connected
      if (socketService.isSocketConnected()) {
        const receiverId = conversation.receiverId;
        if (conversation.type === "PRIVATE" && receiverId) {
          socketService.sendChatMessage(
            conversationId,
            messageText,
            receiverId,
          );
        } else {
          socketService.sendChatMessage(conversationId, messageText);
        }
      }

      // Send via API for persistence
      const apiPayload: any = {
        conversationId,
        content: messageText,
        type: "TEXT",
      };

      if (conversation.type === "PRIVATE" && conversation.receiverId) {
        apiPayload.receiverId = conversation.receiverId;
      }

      const response = await sendMessage(apiPayload);

      // Update temporary message with real ID
      if (response?.message?.id || response?.data?.id) {
        const realId = response.message?.id || response.data.id;
        processedMessageIds.current.add(realId);

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === tempId
              ? { ...msg, id: realId, isTemporary: false }
              : msg,
          ),
        );
      }

      if (replyingTo) setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSendVoice = async (uri: string, duration: number) => {
    try {
      const conversationId = Array.isArray(id) ? id[0] : id;

      sendSocketMessage(
        conversationId,
        JSON.stringify({ type: "voice", uri, duration }),
      );

      await sendMessage({
        conversationId,
        content: "",
        type: "voice",
        file: uri,
      });

      const newMessage: Message = {
        id: Date.now().toString(),
        content: "",
        senderId: user?.id || "",
        receiverId: conversationId,
        timestamp: new Date().toISOString(),
        status: "sent",
        type: "voice",
        reaction: "",
        voice: { uri, duration, isPlaying: false },
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

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
  };

  const handleSendFile = () => {
    console.log("File sending functionality needs to be implemented");
  };

  // Voice playback functionality
  const handlePlayVoice = async (messageId: string, uri: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;

        if (playbackUpdateInterval.current) {
          clearInterval(playbackUpdateInterval.current);
          playbackUpdateInterval.current = null;
        }
      }

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

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setCurrentlyPlaying(messageId);
      setPlaybackProgress(0);

      setMessages(
        messages.map((msg) =>
          msg.id === messageId && msg.voice
            ? { ...msg, voice: { ...msg.voice, isPlaying: true } }
            : msg,
        ),
      );

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current
          .stopAsync()
          .then(() => soundRef.current?.unloadAsync())
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          ref={flatListRef}
          className="flex-1 bg-gray-50"
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => {
            if (!isLoadingMore && messages.length > 0) {
              scrollToBottom(false);
            }
          }}
          onLayout={() => {
            if (messages.length > 0) {
              scrollToBottom(false);
            }
          }}
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
            if (
              msg.file &&
              typeof msg.file === "string" &&
              msg.file.toLowerCase().includes(".gif")
            ) {
              msg.type = "GIF";
            }

            return (
              <View className="mb-4">
                <ChatBubble
                  message={msg}
                  onReaction={handleReaction}
                  onReply={handleReply}
                  currentUserId={user?.id}
                />
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
