import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ConversationItemProps {
  id: string;
  avatar?: string;
  name: string;
  lastMessage: string;
  time: string;
  unseen?: boolean;
  unseenCount?: number;
  isGroup?: boolean;
  onPress?: () => void;
}

const ConversationItem = ({
  id,
  avatar,
  name,
  lastMessage,
  time,
  unseen = false,
  unseenCount = 0,
  isGroup = false,
  onPress,
}: ConversationItemProps) => {
  const handlePress = () => {
    onPress?.();
    router.push({
      pathname: "/chat/[id]",
      params: { id },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
    >
      {/* Avatar */}
      <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            className="w-full h-full rounded-full"
          />
        ) : (
          <Ionicons name="person" size={24} color="#9CA3AF" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center">
          {isGroup && (
            <Ionicons
              name="people"
              size={16}
              color="#6B7280"
              className="mr-1"
            />
          )}
          <Text
            className={`text-lg font-medium flex-1 mr-2 ${
              unseen ? "text-black !font-bold" : "text-gray-900"
            }`}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text className="text-sm text-gray-500">{time}</Text>
        </View>
        <View className="flex-row items-center">
          <Text
            className={`text-base flex-1 mr-2 ${
              unseen ? "text-black font-bold" : "text-gray-500"
            }`}
            numberOfLines={1}
          >
            {lastMessage}
          </Text>
          {unseen && unseenCount > 0 && (
            <View className="bg-gray-300 rounded-full min-w-[20px] h-5 items-center justify-center px-2.5">
              <Text className="text-white text-sm font-bold">
                {unseenCount > 99 ? "99+" : unseenCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ConversationItem;
