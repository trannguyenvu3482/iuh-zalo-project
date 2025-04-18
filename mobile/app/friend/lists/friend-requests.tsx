import React, { useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const FriendRequests = () => {
  // State để quản lý tab hiện tại
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  // Dữ liệu mẫu cho lời mời kết bạn
  const receivedRequests = [
    {
      id: "1",
      name: "Nguyễn Văn A",
      avatar: "https://via.placeholder.com/150",
      message: "Muốn kết bạn",
    },
    {
      id: "2",
      name: "Trần Thị B",
      avatar: "https://via.placeholder.com/150",
      message: "Muốn kết bạn",
    },
    {
      id: "3",
      name: "Lê Văn C",
      avatar: "https://via.placeholder.com/150",
      message: "Muốn kết bạn",
    },
  ];

  const sentRequests = [
    {
      id: "4",
      name: "Phạm Thị D",
      avatar: "https://via.placeholder.com/150",
      message: "Muốn kết bạn",
    },
    {
      id: "5",
      name: "Hoàng Văn E",
      avatar: "https://via.placeholder.com/150",
      message: "Muốn kết bạn",
    },
    {
      id: "6",
      name: "Nguyễn Thị F",
      avatar: "https://via.placeholder.com/150",
      message: "Muốn kết bạn",
    },
  ];

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-blue-500">
        <TouchableOpacity className="mr-4" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Lời mời kết bạn</Text>
        <View className="flex-1" />
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 items-center py-3 ${
            activeTab === "received" ? "border-b-2 border-blue-500" : ""
          }`}
          onPress={() => setActiveTab("received")}
        >
          <Text
            className={`${
              activeTab === "received" ? "text-blue-500" : "text-gray-500"
            } font-medium`}
          >
            Đã nhận {receivedRequests.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 items-center py-3 ${
            activeTab === "sent" ? "border-b-2 border-blue-500" : ""
          }`}
          onPress={() => setActiveTab("sent")}
        >
          <Text
            className={`${
              activeTab === "sent" ? "text-blue-500" : "text-gray-500"
            } font-medium`}
          >
            Đã gửi {sentRequests.length}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nội dung */}
      <ScrollView className="flex-1">
        {activeTab === "received" && (
          <>
            {/* Danh sách "Đã nhận" */}
            {receivedRequests.map((request) => (
              <View
                key={request.id}
                className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200"
              >
                <Image
                  source={{ uri: request.avatar }}
                  className="w-12 h-12 rounded-full"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-base font-medium text-gray-900">
                    {request.name}
                  </Text>
                  <Text className="text-sm text-gray-500">{request.message}</Text>
                </View>
                <TouchableOpacity className="px-4 py-2 bg-gray-200 rounded-lg mr-2">
                  <Text className="text-gray-800 text-sm font-medium">Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity className="px-4 py-2 bg-blue-500 rounded-lg">
                  <Text className="text-white text-sm font-medium">Đồng ý</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {activeTab === "sent" && (
          <>
            {/* Danh sách "Đã gửi" */}
            {sentRequests.map((request) => (
              <View
                key={request.id}
                className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200"
              >
                <Image
                  source={{ uri: request.avatar }}
                  className="w-12 h-12 rounded-full"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-base font-medium text-gray-900">
                    {request.name}
                  </Text>
                  <Text className="text-sm text-gray-500">{request.message}</Text>
                </View>
                <TouchableOpacity className="px-4 py-2 bg-gray-200 rounded-lg">
                  <Text className="text-gray-800 text-sm font-medium">Thu hồi</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default FriendRequests;