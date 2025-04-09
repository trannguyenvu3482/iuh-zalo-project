import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Fake data for now
const fakeSearchResults = [
  {
    id: 1,
    name: "Đông Nhi",
    phoneNumber: "0708119786",
    avatar: null,
  },
  {
    id: 2,
    name: "Ngọc Phát",
    phoneNumber: "0987654321",
    avatar: null,
  },
  {
    id: 3,
    name: "Vũ Trần",
    phoneNumber: "0903252508",
    avatar: null,
  },
  {
    id: 4,
    name: "Nguyễn Huy",
    phoneNumber: "0147852369",
    avatar: null,
  },
];

const fakeMessages = [
  {
    id: 1,
    name: "Đông Nhi",
    lastMessage: "Có gì check giúp em với nhennn",
    time: "15 phút trước",
  },
  {
    id: 2,
    name: "Ngọc Phát",
    lastMessage: "Ê check bài tập lớn đi br",
    time: "1 giờ trước",
  },
  {
    id: 3,
    name: "DH17KTPMC",
    lastMessage: "Nguyễn Trọng Tiến: Kính gửi các thầy cô thông báo...",
    time: "10 phút trước",
  },
];

const fakeDiscoveries = [
  {
    id: 1,
    name: "Zalo Official",
    description: "Tài khoản Zalo chính thức",
    avatar: null,
    followers: "1.2M",
  },
  {
    id: 2,
    name: "Zalo News",
    description: "Tin tức và cập nhật mới nhất",
    avatar: null,
    followers: "800K",
  },
  {
    id: 3,
    name: "Zalo Support",
    description: "Hỗ trợ khách hàng và trợ giúp",
    avatar: null,
    followers: "500K",
  },
];

const SearchResultsPanel = () => {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "messages", label: "Tin nhắn" },
    { id: "discover", label: "Khám phá" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "all":
        return (
          <>
            {/* Phone Number Search Section */}
            <Text className="font-semibold text-gray-700 mb-2">
              Tìm bạn qua số điện thoại (4)
            </Text>
            {fakeSearchResults.map((user) => (
              <TouchableOpacity
                key={user.id}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                  {user.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <Ionicons name="person" size={24} color="#9CA3AF" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">
                    {user.name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Số điện thoại:{" "}
                    <Text className="text-primary">{user.phoneNumber}</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Messages Section */}
            <Text className="font-semibold text-gray-700 mt-4 mb-2">
              Tin nhắn (3)
            </Text>
            {fakeMessages.map((message) => (
              <TouchableOpacity
                key={message.id}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                  <Ionicons name="chatbubble" size={24} color="#9CA3AF" />
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-base font-medium text-gray-900">
                      {message.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {message.time}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-500">
                    {message.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Discover Section */}
            <Text className="font-semibold text-gray-700 mt-4 mb-2">
              Khám phá (3)
            </Text>
            {fakeDiscoveries.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                  {item.avatar ? (
                    <Image
                      source={{ uri: item.avatar }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <Ionicons name="globe" size={24} color="#9CA3AF" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {item.description}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">
                    {item.followers} người theo dõi
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        );
      case "messages":
        return (
          <>
            <Text className="font-semibold text-gray-700 mb-2">
              Tin nhắn (3)
            </Text>
            {fakeMessages.map((message) => (
              <TouchableOpacity
                key={message.id}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                  <Ionicons name="chatbubble" size={24} color="#9CA3AF" />
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-base font-medium text-gray-900">
                      {message.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {message.time}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-500">
                    {message.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        );
      case "discover":
        return (
          <>
            <Text className="font-semibold text-gray-700 mb-2">
              Khám phá (3)
            </Text>
            {fakeDiscoveries.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                  {item.avatar ? (
                    <Image
                      source={{ uri: item.avatar }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <Ionicons name="globe" size={24} color="#9CA3AF" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {item.description}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">
                    {item.followers} người theo dõi
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      className="absolute top-[110px] left-0 right-0 bottom-0 bg-white z-40"
      edges={["bottom"]}
    >
      <ScrollView className="flex-1">
        <View className="px-4 pb-2">
          {/* Tab Switcher */}
          <View className="flex-row border-b border-gray-200 mb-4">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`py-2 px-4 ${
                  activeTab === tab.id
                    ? "border-b-2 border-black"
                    : "border-b-2 border-transparent"
                }`}
              >
                <Text
                  className={`font-medium ${
                    activeTab === tab.id ? "text-black" : "text-gray-500"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchResultsPanel;
