import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSignupStore } from "~/store/signupStore";

export default function CreateAvatarScreen() {
  const { setAvatar: setAvatarStore, setHasAvatar } = useSignupStore();
  const fullName = useSignupStore((state) => state.data.fullName);
  const [avatar, setAvatar] = useState<string>(
    `https://ui-avatars.com/api/?name=${fullName}&font-size=0.25&background=86ab56&color=fff&size=80`,
  );
  const router = useRouter();

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
        setHasAvatar(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const handleUpdate = () => {
    // Save to signup store
    setAvatarStore(avatar);
    router.push("/(auth)/signup/createPassword");
  };

  const handleSkip = () => {
    router.push("/(auth)/signup/createPassword");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center px-4 pt-16 pb-8">
        {/* Tiêu đề */}
        <View className="items-center flex-1">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Cập nhật ảnh đại diện
          </Text>
          <Text className="text-base text-gray-500 mb-8 text-center">
            Đặt ảnh đại diện để mọi người dễ nhận ra bạn
          </Text>

          {/* Vòng tròn ảnh đại diện */}
          <TouchableOpacity
            onPress={handlePickImage}
            className="w-32 h-32 rounded-full items-center justify-center mb-8"
          >
            <Image
              source={{ uri: avatar }}
              className="w-full h-full rounded-full"
            />
            <View className="items-center justify-center bg-gray-200 rounded-full w-10 h-10 absolute bottom-0 right-0">
              <Ionicons name="camera-outline" size={20} color="gray" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Nút cập nhật */}
        <TouchableOpacity
          onPress={handleUpdate}
          className="w-full bg-primary py-3 rounded-full items-center"
        >
          <Text className="text-white font-bold text-base">Cập nhật</Text>
        </TouchableOpacity>

        {/* Nút bỏ qua */}
        <TouchableOpacity onPress={handleSkip} className="mt-4 items-center">
          <Text className="font-semibold text-base">Bỏ qua</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
