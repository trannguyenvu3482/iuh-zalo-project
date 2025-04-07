import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { Message } from "./types";

interface ReplyBarProps {
  message: Message | null;
  onClose: () => void;
}

const ReplyBar = ({ message, onClose }: ReplyBarProps) => {
  if (!message) return null;

  return (
    <View className="bg-gray-100 p-2 border-t border-gray-200">
      <View className="flex-row items-start">
        <View className="flex-1 pl-2 border-l-4 border-blue-500">
          <View className="flex-row items-center">
            <Ionicons name="arrow-undo-outline" size={14} color="#3B82F6" />
            <Text className="text-xs text-blue-500 font-medium ml-1">
              Trả lời {message.sender === "me" ? "chính mình" : ""}
            </Text>
          </View>
          <Text className="text-sm text-gray-700 mt-1" numberOfLines={1}>
            {message.content}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          className="p-1 ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ReplyBar;
