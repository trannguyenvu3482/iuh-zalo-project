import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function CreateAvatarScreen() {
  const [avatar, setAvatar] = useState<string | null>(null); // Lưu đường dẫn ảnh đại diện
  const router = useRouter();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri); // Lưu đường dẫn ảnh đã chọn
    }
  };

  const handleUpdate = () => {
    // TODO: Thực hiện logic cập nhật ảnh đại diện
    console.log("Avatar updated:", avatar);
    router.push("/(root)/messages"); // Điều hướng đến trang chính
  };

  const handleSkip = () => {
    router.push("/(root)/messages"); // Điều hướqua và điều hướng đến trang chính
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-4">
        {/* Tiêu đề */}
        <Text className="text-xl font-semibold text-gray-800 mb-2">
          Cập nhật ảnh đại diện
        </Text>
        <Text className="text-sm text-gray-500 mb-8 text-center">
          Đặt ảnh đại diện để mọi người dễ nhận ra bạn
        </Text>

        {/* Vòng tròn ảnh đại diện */}
        <TouchableOpacity
          onPress={handlePickImage}
          className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center mb-8"
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              className="w-full h-full rounded-full"
            />
          ) : (
            <View className="items-center justify-center">
              <Ionicons name="camera-outline" size={32} color="gray" />
              <Text className="text-sm text-gray-500 mt-2">Chọn ảnh</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Nút cập nhật */}
        <TouchableOpacity
          onPress={handleUpdate}
          className="w-full bg-blue-500 py-3 rounded-lg items-center"
        >
          <Text className="text-white font-semibold text-base">Cập nhật</Text>
        </TouchableOpacity>

        {/* Nút bỏ qua */}
        <TouchableOpacity
          onPress={handleSkip}
          className="mt-4 items-center"
        >
          <Text className="text-blue-500 font-semibold text-base">Bỏ qua</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}