import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const FriendProfile = () => {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Cover Photo */}
      <View className="w-full h-48 relative">
        <Image
          source={{ uri: "https://i.imgur.com/your-cover-photo.jpg" }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {/* Back Button */}
        <TouchableOpacity className="absolute top-4 left-4 bg-black/40 rounded-full p-2">
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        {/* Call & More */}
        <View className="absolute top-4 right-4 flex-row space-x-2">
          <TouchableOpacity className="bg-black/40 rounded-full p-2">
            <Ionicons name="call-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity className="bg-black/40 rounded-full p-2">
            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Avatar */}
        <View className="absolute -bottom-12 left-1/2 -translate-x-1/2 items-center">
          <Image
            source={{ uri: "https://i.imgur.com/your-avatar.jpg" }}
            className="w-24 h-24 rounded-full border-4 border-white"
          />
        </View>
      </View>

      {/* Name & Edit */}
      <View className="mt-16 items-center">
        <Text className="text-xl font-bold text-gray-900">Mẫu Thân</Text>
        <TouchableOpacity className="absolute right-4 top-2 flex-row items-center">
          <Ionicons name="create-outline" size={16} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Tabs: Ảnh, Video */}
      <View className="flex-row justify-center mt-6 space-x-4">
        <TouchableOpacity className="flex-row items-center px-4 py-2 bg-white rounded-full">
          <Ionicons name="image-outline" size={18} color="#007AFF" />
          <Text className="ml-2 text-base text-gray-900 font-medium">Ảnh 30</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center px-4 py-2 bg-white rounded-full">
          <Ionicons name="videocam-outline" size={18} color="#22c55e" />
          <Text className="ml-2 text-base text-gray-900 font-medium">Video 1</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <View className="mt-6 px-4">
        {/* Ngày tháng */}
        <View className="flex-row items-center mb-2">
          <View className="w-1 h-4 bg-gray-300 rounded-full mr-2" />
          <Text className="text-xs text-gray-500 font-medium">2 tháng 2</Text>
        </View>
        {/* Bài viết */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-green-600 font-semibold mb-2">Du Xuân cùng các con</Text>
          <View className="flex-row space-x-2 mb-2">
            <Image
              source={{ uri: "https://i.imgur.com/photo1.jpg" }}
              className="w-24 h-24 rounded-lg"
            />
            <Image
              source={{ uri: "https://i.imgur.com/photo2.jpg" }}
              className="w-24 h-24 rounded-lg"
            />
            <Image
              source={{ uri: "https://i.imgur.com/photo3.jpg" }}
              className="w-24 h-24 rounded-lg"
            />
          </View>
          <View className="flex-row items-center mb-1">
            <Ionicons name="heart" size={16} color="#ef4444" />
            <Text className="ml-1 text-gray-500 text-sm">15 bạn</Text>
            <Text className="ml-4 text-gray-500 text-sm">1 bình luận</Text>
          </View>
          <View className="flex-row space-x-4 mt-2">
            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="heart-outline" size={18} color="#888" />
              <Text className="ml-1 text-gray-700">Thích</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#888" />
              <Text className="ml-1 text-gray-700">Bình luận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer Banner */}
      <View className="mt-4">
        <Image
          source={{ uri: "https://i.imgur.com/dragon-banner.jpg" }}
          className="w-full h-24"
          resizeMode="cover"
        />
        <Text className="absolute left-4 bottom-4 text-white text-lg font-bold">2024</Text>
        {/* Nút nhắn tin */}
        <TouchableOpacity className="absolute right-4 bottom-4 bg-white px-4 py-2 rounded-full flex-row items-center shadow">
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#007AFF" />
          <Text className="ml-2 text-primary font-semibold">Nhắn tin</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default FriendProfile;