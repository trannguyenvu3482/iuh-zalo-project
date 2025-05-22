import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getConversations } from "../../api/apiConversation";
import ConversationItem from "../../components/ConversationItem";
import { formatTimeAgo } from "../../utils/dateUtils";

type FilterOption = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Conversation = {
  id: string;
  name: string;
  avatar?: string;
  type: string;
  lastMessage: {
    content: string;
    sender: {
      id: string;
      fullName: string;
    };
    createdAt: string;
  } | null;
  unreadCount: number;
};

const Messages = () => {
  const [activeTab, setActiveTab] = useState("priority");
  const [showFilter, setShowFilter] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: "priority", label: "Ưu tiên" },
    { id: "other", label: "Khác" },
  ];

  const filterOptions: FilterOption[] = [
    { id: "unread", label: "Chưa đọc", icon: "mail" },
    { id: "mentions", label: "Nhắc đến tôi", icon: "at" },
  ];

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await getConversations();
        setConversations(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
        setError("Không thể tải tin nhắn. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const getLastMessageText = (conversation: Conversation) => {
    if (!conversation.lastMessage) return "Chưa có tin nhắn";

    if (conversation.type === "GROUP") {
      return `${conversation.lastMessage.sender.fullName}: ${conversation.lastMessage.content}`;
    }

    return conversation.lastMessage.content;
  };

  return (
    <View className="flex-1 bg-white">
      {/* Tabs */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <View className="flex-row gap-4">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`pb-2 ${activeTab === tab.id
                  ? "border-b-2 border-primary"
                  : "border-b-2 border-transparent"
                }`}
            >
              <Text
                className={`text-lg font-medium ${activeTab === tab.id ? "text-primary" : "text-gray-500"
                  }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AntDesign name="filter" size={24} color="#257dfd" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="large" color="#257dfd" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-red-500">{error}</Text>
            <TouchableOpacity
              className="mt-4 px-4 py-2 bg-primary rounded-md"
              onPress={() => {
                setIsLoading(true);
                getConversations()
                  .then((response) => {
                    setConversations(response.data);
                    setError(null);
                  })
                  .catch((err) => {
                    console.error(err);
                    setError("Không thể tải tin nhắn. Vui lòng thử lại sau.");
                  })
                  .finally(() => setIsLoading(false));
              }}
            >
              <Text className="text-white">Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-gray-500">Không có cuộc trò chuyện nào</Text>
          </View>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              id={conversation.id}
              avatar={conversation.avatar}
              name={conversation.name}
              lastMessage={getLastMessageText(conversation)}
              time={
                conversation.lastMessage
                  ? formatTimeAgo(new Date(conversation.lastMessage.createdAt))
                  : ""
              }
              unseen={conversation.unreadCount > 0}
              unseenCount={conversation.unreadCount}
              isGroup={conversation.type === "GROUP"}
              onPress={() => {
                console.log("Pressed conversation:", conversation.id);
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilter(false)}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        >
          <View className="absolute top-24 right-4 w-48 bg-white rounded-lg shadow-lg">
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                className="px-4 py-3 border-b border-gray-100 last:border-0 flex-row items-center"
                onPress={() => {
                  // Handle filter option selection
                  setShowFilter(false);
                }}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color="#6B7280"
                  className="mr-3"
                />
                <Text className="text-gray-800">{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Messages;
