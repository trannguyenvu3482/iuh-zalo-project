import React from "react";
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const AddFriend = () => {
  return (
    <ScrollView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity className="mr-4" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold">Thêm bạn</Text>
      </View>

      {/* QR Code Section */}
      <View className="bg-white items-center p-4 mt-4">
        <Image
          source={{ uri: "https://via.placeholder.com/150" }} // Thay bằng URL QR code thực tế
          className="w-40 h-40 rounded-lg"
        />
        <Text className="text-lg font-bold mt-2">Trần Ngọc Phát</Text>
        <Text className="text-gray-500 mt-1">Quét mã để thêm bạn Zalo với tôi</Text>
      </View>

      {/* Input Section */}
      <View className="bg-white mt-4 px-4 py-3">
        <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
          <Text className="text-gray-500 mr-2">+84</Text>
          <TextInput
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            className="flex-1 text-gray-800"
          />
          <TouchableOpacity>
            <Ionicons name="arrow-forward" size={24} color="gray" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Options Section */}
      <View className="bg-white mt-4">
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-200"
          onPress={() => Alert.alert("Quét mã QR", "Chức năng quét mã QR chưa được triển khai.")}
        >
          <Ionicons name="qr-code" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Quét mã QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-200"
          onPress={() => Alert.alert("Danh bạ máy", "Chức năng danh bạ máy chưa được triển khai.")}
        >
          <Ionicons name="person" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Danh bạ máy</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center px-4 py-3">
          <Ionicons name="people" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Bạn bè có thể quen</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Section */}
      <View className="px-4 py-3">
        <Text className="text-gray-500 text-center">
          Xem lời mời kết bạn đã gửi tại trang Danh bạ Zalo
        </Text>
      </View>
    </ScrollView>
  );
};

export default AddFriend;