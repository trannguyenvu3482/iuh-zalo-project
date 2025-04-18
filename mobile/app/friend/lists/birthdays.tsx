import React from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Birthdays = () => {
  // Dữ liệu mẫu
  const pastBirthdays = [
    { id: "1", name: "Nô", date: "Thứ Tư, 16 tháng 4", avatar: "https://via.placeholder.com/150" },
    { id: "2", name: "Minh Trung", date: "Thứ Sáu, 11 tháng 4", avatar: "https://via.placeholder.com/150" },
    { id: "3", name: "Phương Thảo", date: "Thứ Sáu, 11 tháng 4", avatar: "https://via.placeholder.com/150" },
  ];

  const upcomingBirthdays = [
    { id: "4", name: "Nguyễn Đức V I B", date: "Thứ Hai, 21 tháng 4", avatar: "https://via.placeholder.com/150" },
    { id: "5", name: "Vy", date: "Thứ Năm, 24 tháng 4", avatar: "https://via.placeholder.com/150" },
    { id: "6", name: "PHÚ ĐÁ", date: "Thứ Bảy, 26 tháng 4", avatar: "https://via.placeholder.com/150" },
    { id: "7", name: "Ngoại", date: "Thứ Ba, 13 tháng 5", avatar: "https://via.placeholder.com/150" },
    { id: "8", name: "Nguyễn Tiến Hùng", date: "Thứ Hai, 19 tháng 5", avatar: "https://via.placeholder.com/150" },
  ];

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity className="mr-4">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold">Sinh nhật</Text>
        <View className="flex-1" />
        <TouchableOpacity className="mr-4">
          <Ionicons name="calendar-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity className="mr-4">
          <Ionicons name="time-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Nội dung */}
      <ScrollView className="flex-1">
        {/* Sinh nhật đã qua */}
        <View className="px-4 py-2 bg-gray-100">
          <Text className="text-sm font-medium text-gray-500">Sinh nhật đã qua</Text>
        </View>
        {pastBirthdays.map((birthday) => (
          <View
            key={birthday.id}
            className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200"
          >
            <Image
              source={{ uri: birthday.avatar }}
              className="w-12 h-12 rounded-full"
            />
            <View className="flex-1 ml-3">
              <Text className="text-base font-medium text-gray-900">{birthday.name}</Text>
              <Text className="text-sm text-gray-500">{birthday.date}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="chatbubble-outline" size={24} color="blue" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Sinh nhật sắp tới */}
        <View className="px-4 py-2 bg-gray-100">
          <Text className="text-sm font-medium text-gray-500">Sinh nhật sắp tới</Text>
        </View>
        {upcomingBirthdays.map((birthday) => (
          <View
            key={birthday.id}
            className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200"
          >
            <Image
              source={{ uri: birthday.avatar }}
              className="w-12 h-12 rounded-full"
            />
            <View className="flex-1 ml-3">
              <Text className="text-base font-medium text-gray-900">{birthday.name}</Text>
              <Text className="text-sm text-gray-500">{birthday.date}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="chatbubble-outline" size={24} color="blue" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default Birthdays;