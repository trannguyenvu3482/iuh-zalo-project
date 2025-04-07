import { Ionicons } from "@expo/vector-icons";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ChatBubble from "../../components/chat/ChatBubble";
import ChatHeader from "../../components/chat/ChatHeader";
import ChatInput from "../../components/chat/ChatInput";
import { Message, Reaction, VoiceData } from "../../components/chat/types";

type ExtendedMessage = Message & {
  voice?: VoiceData;
};

const mockMessages: ExtendedMessage[] = [
  {
    id: "2",
    content:
      "Xin chào! Tôi là Đông Nhi, một người bạn tốt, tôi rất vui được gặp bạn!",
    sender: "other",
    timestamp: "12:31",
    type: "text",
    reaction: "",
  },
  {
    id: "3",
    content: "Chào bạn!",
    sender: "me",
    timestamp: "12:32",
    type: "text",
    reaction: "",
  },
  {
    id: "4",
    content: "Bạn có khỏe không? ",
    sender: "other",
    timestamp: "12:33",
    type: "text",
    reaction: "",
  },
  {
    id: "5",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
    reaction: "",
  },
  {
    id: "6",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
    reaction: "",
  },
  {
    id: "7",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
    reaction: "",
  },
  {
    id: "8",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
    reaction: "",
  },
  {
    id: "9",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
    reaction: "",
  },
  {
    id: "10",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
    reaction: "",
  },
  {
    id: "11",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
    reaction: "",
  },
  {
    id: "12",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
    reaction: "",
  },
  {
    id: "13",
    // super long content
    content:
      "Nóng hổi vừa thổi vừa ăn, nhanh gọn order một phần Bún bò bất cứ khi nào bạn muốn mà chẳng lo phí này phí kia, GrabFood bao trọn gói với Bộ sưu tập Một Người Ăn: Chỉ 39.000Đ không thêm bất kỳ phí nào. Nóng hổi vừa thổi vừa ăn, nhanh gọn order một phần Bún bò bất cứ khi nào bạn muốn mà chẳng lo phí này phí kia, GrabFood bao trọn gói với Bộ sưu tập Một Người Ăn: Chỉ 39.000Đ không thêm bất kỳ phí nào. Nóng hổi vừa thổi vừa ăn, nhanh gọn order một phần Bún bò bất cứ khi nào bạn muốn mà chẳng lo phí này phí kia, GrabFood bao trọn gói với Bộ sưu tập Một Người Ăn: Chỉ 39.000Đ không thêm bất kỳ phí nào ",
    sender: "me",
    timestamp: "12:34",
    type: "text",
    reaction: "",
  },
];

export default function Chat() {
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ExtendedMessage[]>(mockMessages);
  const [replyingTo, setReplyingTo] = useState<ExtendedMessage | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const playbackUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Store generated waveforms per message
  const [waveforms] = useState<Record<string, number[]>>({});

  // Store animated values for waveform bars
  const [animatedValues, setAnimatedValues] = useState<
    Record<string, Animated.Value[]>
  >({});

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
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: ExtendedMessage = {
        id: Date.now().toString(),
        content: message,
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "text",
        reaction: "",
      };

      setMessages([...messages, newMessage]);
      setMessage("");
      scrollToBottom();

      // Clear reply mode if active
      if (replyingTo) {
        setReplyingTo(null);
      }
    }
  };

  const handleSendVoice = async (uri: string, duration: number) => {
    const newMessage: ExtendedMessage = {
      id: Date.now().toString(),
      content: "",
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "voice",
      reaction: "",
      voice: {
        uri,
        duration,
        isPlaying: false,
      },
    };

    setMessages([...messages, newMessage]);
    scrollToBottom();
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
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 p-4 bg-gray-50"
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((msg) => (
            <View key={msg.id} className="mb-4">
              {msg.type !== "voice" && (
                <ChatBubble
                  message={msg}
                  onReaction={handleReaction}
                  onReply={handleReply}
                />
              )}
              {msg.voice && renderVoiceMessage(msg)}
            </View>
          ))}
        </ScrollView>

        <ChatInput
          message={message}
          onMessageChange={setMessage}
          onSend={handleSend}
          onSendVoice={handleSendVoice}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
