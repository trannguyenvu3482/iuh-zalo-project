import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
const InfoChat = () => {
  const [isBestFriend, setIsBestFriend] = useState(false);
  const [isPinned, setIsPinned] = useState(false); // State cho "Ghim trò chuyện"
  const [isHidden, setIsHidden] = useState(false); // State cho "Ẩn trò chuyện"
  const [isCallNotificationEnabled, setIsCallNotificationEnabled] = useState(false); // State cho "Báo cuộc gọi đến"

  return (
    <ScrollView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-blue-500 p-4 flex-row items-center">
        <TouchableOpacity className="mr-4" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Tùy chọn</Text>
      </View>

      {/* Profile Section */}
      <View className="bg-white items-center p-4">
        <Image
          source={{ uri: "https://i.pravatar.cc/150?img=12" }}
          className="w-24 h-24 rounded-full"
        />
        <Text className="text-lg font-bold mt-2">Thi Nấm Xanh</Text>
        <Text className="text-gray-500">Người Nông dân trồng nấm tại www.namxanh.vn</Text>

        {/* Action Buttons */}
        <View className="flex-row mt-4">
          <TouchableOpacity className="items-center mx-4">
            <Ionicons name="search" size={24} color="gray" />
            <Text className="text-sm text-gray-600 mt-1">Tìm tin nhắn</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center mx-4">
            <Ionicons name="person" size={24} color="gray" />
            <Text className="text-sm text-gray-600 mt-1">Trang cá nhân</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center mx-4">
            <Ionicons name="image" size={24} color="gray" />
            <Text className="text-sm text-gray-600 mt-1">Đổi hình nền</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center mx-4">
            <Ionicons name="notifications" size={24} color="gray" />
            <Text className="text-sm text-gray-600 mt-1">Tắt thông báo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Options Section */}
      <View className="bg-white mt-4">
        <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="pencil" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Đổi tên gợi nhớ</Text>
        </TouchableOpacity>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="star" size={20} color="gray" />
          <Text className="ml-4 text-gray-800 flex-1">Đánh dấu bạn thân</Text>
          <Switch
            value={isBestFriend}
            onValueChange={setIsBestFriend}
            trackColor={{ false: "#ccc", true: "#4CAF50" }}
          />
        </View>
        <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="time" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Nhật ký chung</Text>
        </TouchableOpacity>
      </View>

      {/* Media Section */}
      <View className="bg-white mt-4">
        <TouchableOpacity className="flex-row items-center px-4 py-3">
          <Ionicons name="folder" size={20} color="gray" />
          <Text className="ml-4 text-gray-800 flex-1">Ảnh, file, link</Text>
          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>
        <ScrollView horizontal className="px-4 py-2">
          <Image
            source={{ uri: "https://via.placeholder.com/80" }}
            className="w-20 h-20 rounded-lg mr-2"
          />
          <Image
            source={{ uri: "https://via.placeholder.com/80" }}
            className="w-20 h-20 rounded-lg mr-2"
          />
          <Image
            source={{ uri: "https://via.placeholder.com/80" }}
            className="w-20 h-20 rounded-lg mr-2"
          />
        </ScrollView>
      </View>

      {/* Group Options */}
      <View className="bg-white mt-4">
        <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="people" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Tạo nhóm với Thi Nấm Xanh</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="person-add" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Thêm Thi Nấm Xanh vào nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center px-4 py-3">
          <Ionicons name="chatbubbles" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Xem nhóm chung (1)</Text>
        </TouchableOpacity>
      </View>
      <View className="bg-white mt-4">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="pin" size={20} color="gray" />
          <Text className="ml-4 text-gray-800 flex-1">Ghim trò chuyện</Text>
          <Switch
            value={isPinned}
            onValueChange={(value) => setIsPinned(value)}
            trackColor={{ false: "#ccc", true: "#4CAF50" }}
          />
        </View>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="eye-off" size={20} color="gray" />
          <Text className="ml-4 text-gray-800 flex-1">Ẩn trò chuyện</Text>
          <Switch
            value={isHidden}
            onValueChange={(value) => setIsHidden(value)}
            trackColor={{ false: "#ccc", true: "#4CAF50" }}
          />
        </View>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="call" size={20} color="gray" />
          <Text className="ml-4 text-gray-800 flex-1">Báo cuộc gọi đến</Text>
          <Switch
            value={isCallNotificationEnabled}
            onValueChange={(value) => setIsCallNotificationEnabled(value)}
            trackColor={{ false: "#ccc", true: "#4CAF50" }}
          />
        </View>
        <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="time" size={20} color="gray" />
          <Text className="ml-4 text-gray-800 flex-1">Tin nhắn tự xóa</Text>
          <Text className="text-gray-500">Không tự xóa</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center px-4 py-3">
          <Ionicons name="settings" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Cài đặt cá nhân</Text>
        </TouchableOpacity>
      </View>

      {/* Report and Block Section */}
      <View className="bg-white mt-4">
        <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="alert-circle" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Báo xấu</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="ban" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Quản lý chặn</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center px-4 py-3">
          <Ionicons name="folder-open" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Dung lượng</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Chat Section */}
      <View className="bg-white mt-4">
        <TouchableOpacity className="flex-row items-center px-4 py-3">
          <Ionicons name="trash" size={20} color="red" />
          <Text className="ml-4 text-red-500">Xóa lịch sử trò chuyện</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default InfoChat;