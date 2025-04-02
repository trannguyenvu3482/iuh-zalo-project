import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const router = useRouter();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      // Handle sending message
      setMessage("");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary">
        <View className="flex-row items-center justify-between px-4 py-2">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-xl text-white">Đông Nhi</Text>
              <View className="flex-row">
                <View className="bg-white rounded-lg">
                  <Text className="text-primary px-2 py-[3px] font-semibold text-sm">
                    NGƯỜI LẠ
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity className="mr-5">
              <Ionicons name="call-outline" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="mr-5">
              <Ionicons name="videocam-outline" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="list-outline" size={26} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-center">
          <Ionicons
            name="person-add-outline"
            size={20}
            color="gray"
            className="mr-2"
          />
          <Text className="text-gray-600">Đã gửi lời mời kết bạn</Text>
        </View>
      </View>

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

        {/* Input */}
        <View className="flex-row items-center px-4 py-2 border-t border-gray-200">
          <TouchableOpacity className="mr-4">
            <Ionicons name="happy-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Tin nhắn"
            placeholderTextColor="#666"
            multiline
            className="flex-1 text-base max-h-24"
            textAlignVertical="center"
          />
          <View className="flex-row items-center gap-5">
            <TouchableOpacity>
              <Ionicons
                name="ellipsis-horizontal-outline"
                size={24}
                color="#666"
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="mic-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="image-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
