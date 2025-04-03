import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ChatHeader from "../../components/chat/ChatHeader";
import ChatInput from "../../components/chat/ChatInput";

type Message = {
  id: string;
  content: string;
  sender: "me" | "other";
  timestamp: string;
  type: "text" | "system";
};

const mockMessages: Message[] = [
  {
    id: "2",
    content:
      "Xin chào! Tôi là Đông Nhi, một người bạn tốt, tôi rất vui được gặp bạn!",
    sender: "other",
    timestamp: "12:31",
    type: "text",
  },
  {
    id: "3",
    content: "Chào bạn!",
    sender: "me",
    timestamp: "12:32",
    type: "text",
  },
  {
    id: "4",
    content: "Bạn có khỏe không? ",
    sender: "other",
    timestamp: "12:33",
    type: "text",
  },
  {
    id: "5",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
  },
  {
    id: "6",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
  },
  {
    id: "7",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
  },
  {
    id: "8",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
  },
  {
    id: "9",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
  },
  {
    id: "10",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
  },
  {
    id: "11",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
  },
  {
    id: "12",
    content: "Tôi khỏe, cảm ơn bạn!",
    sender: "me",
    timestamp: "12:34",
    type: "text",
  },
];

export default function Chat() {
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      // Handle sending message
      setMessage("");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ChatHeader name="Đông Nhi" isStranger />

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4 bg-gray-50">
          {mockMessages.map((msg) => (
            <View
              key={msg.id}
              className={`mb-4 ${
                msg.type === "system"
                  ? "items-center"
                  : msg.sender === "me"
                    ? "items-end"
                    : "items-start"
              }`}
            >
              {msg.type === "system" ? (
                <View className="bg-gray-100 px-4 py-1 rounded-full">
                  <Text className="text-sm text-gray-500">{msg.content}</Text>
                </View>
              ) : msg.sender === "me" ? (
                <View className="bg-blue-500 rounded-2xl px-4 py-2 max-w-[80%]">
                  <Text className="text-white">{msg.content}</Text>
                  <Text className="text-xs text-white/80 mt-1">
                    {msg.timestamp}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-end">
                  <View className="w-8 h-8 rounded-full bg-gray-200 mr-2">
                    <Image
                      source={{ uri: "https://i.pravatar.cc/300" }}
                      className="w-full h-full rounded-full"
                    />
                  </View>
                  <View>
                    <View className="bg-white border border-gray-200 rounded-2xl px-4 py-2 max-w-[80%] mb-3">
                      <Text className="text-gray-900">{msg.content}</Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {msg.timestamp}
                      </Text>
                    </View>
                    <View className="absolute bottom-0 right-4 mr-4">
                      <TouchableOpacity className="bg-white rounded-full p-1 shadow-sm border border-gray-100">
                        <Ionicons name="heart-outline" size={14} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <ChatInput
          message={message}
          onMessageChange={setMessage}
          onSend={handleSend}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
