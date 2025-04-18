import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PhoneContacts = () => {
  const [activeTab, setActiveTab] = useState<"all" | "not-friends">("all");

  // Dữ liệu mẫu
  const contacts = [
    { id: "1", name: "Cô Ve Chai CT", zaloName: "Ngọc Vân", avatar: "https://via.placeholder.com/150", status: "new" },
    { id: "2", name: "Anh Khang", zaloName: "Thiệu Khang", avatar: "https://via.placeholder.com/150", status: "friend" },
    { id: "3", name: "Anh Queo", zaloName: "Lam Son Khoai", avatar: "https://via.placeholder.com/150", status: "add" },
    { id: "4", name: "Anh Trung Training", zaloName: "Trung", avatar: "https://via.placeholder.com/150", status: "add" },
    { id: "5", name: "Bác Tí", zaloName: "Trường Sơn", avatar: "https://via.placeholder.com/150", status: "sent" },
    { id: "6", name: "Cậu Hải", zaloName: "Phi Hải", avatar: "https://via.placeholder.com/150", status: "friend" },
    { id: "7", name: "Chú Du", zaloName: "Nguyen Du", avatar: "https://via.placeholder.com/150", status: "add" },
  ];

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-blue-500">
        <TouchableOpacity className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Danh bạ máy</Text>
        <View className="flex-1" />
        <TouchableOpacity>
          <Ionicons name="sync" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Thông tin cập nhật */}
      <View className="px-4 py-2 bg-white border-b border-gray-200">
        <Text className="text-sm text-gray-500">Lần cập nhật danh bạ gần nhất</Text>
        <Text className="text-sm font-medium text-gray-900">14:16, 16/04/2025</Text>
      </View>

      {/* Thanh tìm kiếm */}
      <View className="px-4 py-2 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            placeholder="Tìm kiếm"
            className="flex-1 ml-2 text-gray-800"
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 items-center py-3 ${
            activeTab === "all" ? "border-b-2 border-blue-500" : ""
          }`}
          onPress={() => setActiveTab("all")}
        >
          <Text
            className={`${
              activeTab === "all" ? "text-blue-500" : "text-gray-500"
            } font-medium`}
          >
            Tất cả {contacts.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 items-center py-3 ${
            activeTab === "not-friends" ? "border-b-2 border-blue-500" : ""
          }`}
          onPress={() => setActiveTab("not-friends")}
        >
          <Text
            className={`${
              activeTab === "not-friends" ? "text-blue-500" : "text-gray-500"
            } font-medium`}
          >
            Chưa là bạn 10
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách liên hệ */}
      <ScrollView className="flex-1">
        <View className="px-4 py-2 bg-gray-100">
          <Text className="text-sm font-medium text-gray-500">Liên hệ mới</Text>
        </View>
        {contacts.map((contact) => (
          <View
            key={contact.id}
            className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200"
          >
            <Image
              source={{ uri: contact.avatar }}
              className="w-12 h-12 rounded-full"
            />
            <View className="flex-1 ml-3">
              <Text className="text-base font-medium text-gray-900">
                {contact.name}
              </Text>
              <Text className="text-sm text-gray-500">Tên Zalo: {contact.zaloName}</Text>
            </View>
            {contact.status === "new" && (
              <View className="px-2 py-1 bg-green-100 rounded-lg">
                <Text className="text-xs text-green-500 font-medium">Mới</Text>
              </View>
            )}
            {contact.status === "add" && (
              <TouchableOpacity className="px-4 py-2 bg-blue-500 rounded-lg">
                <Text className="text-white text-sm font-medium">Kết bạn</Text>
              </TouchableOpacity>
            )}
            {contact.status === "friend" && (
              <Text className="text-sm text-gray-500">Đã là bạn</Text>
            )}
            {contact.status === "sent" && (
              <TouchableOpacity className="px-4 py-2 bg-gray-200 rounded-lg">
                <Text className="text-gray-800 text-sm font-medium">Thu hồi</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default PhoneContacts;