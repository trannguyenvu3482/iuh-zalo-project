import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ConversationItem from "../../components/ConversationItem";

type FilterOption = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar?: string;
  unseen?: boolean;
  unseenCount?: number;
  isGroup?: boolean;
};

// Temporary mock data
const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "Đông Nhi",
    lastMessage: "Có gì check giúp em với nhennn",
    time: "15 phút trước",
    avatar:
      "https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/277800c6380fe2ec40459775013b1c9d~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=1618fbe7&x-expires=1743789600&x-signature=8ocZ32EWjEyVM8pQXNHaCSZdgJM%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my",
    unseen: true,
    unseenCount: 2,
  },
  {
    id: "2",
    name: "Ngọc Phát",
    lastMessage: "Ê check bài tập lớn đi br",
    time: "1 giờ trước",
    unseen: true,
    unseenCount: 1,
  },
  {
    id: "3",
    name: "DH17KTPMC",
    lastMessage: "Nguyễn Trọng Tiến: Kính gửi các thầy cô thông báo...",
    time: "10 phút trước",
    isGroup: true,
    unseen: true,
    unseenCount: 5,
  },
  {
    id: "4",
    name: "Mẹ",
    lastMessage: "Con ăn cơm chưa?",
    time: "2 giờ trước",
    avatar: "https://i.pravatar.cc/150?img=12",
    unseen: false,
  },
  {
    id: "5",
    name: "Nhóm học tập",
    lastMessage: "Huy: Tôi đã hoàn thành bài tập và gửi lên drive rồi",
    time: "3 giờ trước",
    isGroup: true,
    unseen: true,
    unseenCount: 8,
  },
  {
    id: "6",
    name: "Zalo Official",
    lastMessage: "Cập nhật mới: Tính năng chat nhóm đã được cải thiện...",
    time: "5 giờ trước",
    avatar: "https://i.pravatar.cc/150?img=1",
    unseen: true,
    unseenCount: 1,
  },
  {
    id: "7",
    name: "Anh trai",
    lastMessage: "Ok, anh sẽ đón em lúc 5h chiều",
    time: "Hôm qua",
    avatar: "https://i.pravatar.cc/150?img=8",
    unseen: false,
  },
  {
    id: "8",
    name: "Nhóm lớp",
    lastMessage: "Admin: Thông báo về lịch học tuần tới...",
    time: "Hôm qua",
    isGroup: true,
    unseen: true,
    unseenCount: 12,
  },
  {
    id: "9",
    name: "Bạn thân",
    lastMessage: "Đi chơi không?",
    time: "Hôm qua",
    avatar: "https://i.pravatar.cc/150?img=5",
    unseen: false,
  },
  {
    id: "10",
    name: "Nhóm dự án",
    lastMessage: "Minh: Tôi đã cập nhật lại file thiết kế...",
    time: "2 ngày trước",
    isGroup: true,
    unseen: true,
    unseenCount: 3,
  },
];

const Messages = () => {
  const [activeTab, setActiveTab] = useState("priority");
  const [showFilter, setShowFilter] = useState(false);

  const tabs = [
    { id: "priority", label: "Ưu tiên" },
    { id: "other", label: "Khác" },
  ];

  const filterOptions: FilterOption[] = [
    { id: "unread", label: "Chưa đọc", icon: "mail" },
    { id: "mentions", label: "Nhắc đến tôi", icon: "at" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Tabs */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <View className="flex-row gap-4">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`pb-2 ${
                activeTab === tab.id
                  ? "border-b-2 border-primary"
                  : "border-b-2 border-transparent"
              }`}
            >
              <Text
                className={`text-lg font-medium ${
                  activeTab === tab.id ? "text-primary" : "text-gray-500"
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
        {mockConversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            id={conversation.id}
            avatar={conversation.avatar}
            name={conversation.name}
            lastMessage={conversation.lastMessage}
            time={conversation.time}
            unseen={conversation.unseen}
            unseenCount={conversation.unseenCount}
            isGroup={conversation.isGroup}
            onPress={() => {
              // Handle conversation press
              console.log("Pressed conversation:", conversation.id);
            }}
          />
        ))}
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
    </SafeAreaView>
  );
};

export default Messages;
