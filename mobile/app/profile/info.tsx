import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserStore } from "~/store/userStore";

const formatBirthdate = (dateString: string | undefined) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function ProfileInfo() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();

  console.log("user", user);

  return (
    <View
      className="flex-1 bg-gray-200 relative"
      style={{ paddingBottom: insets.bottom }}
    >
      {/* Banner and Profile Section */}
      <View className="w-full">
        <Image
          source={{ uri: "https://picsum.photos/1200/400" }}
          className="w-full h-60"
          resizeMode="cover"
          resizeMethod="resize"
        />
        <TouchableOpacity
          className="absolute top-2 left-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back-outline" size={24} color="white" />
        </TouchableOpacity>
        <View className="absolute bottom-4 left-4 flex-row items-center">
          <Image
            source={{ uri: user?.avatar || "https://picsum.photos/200/200" }}
            className="w-16 h-16 rounded-full border-2 border-white"
            resizeMode="cover"
            resizeMethod="resize"
          />
          <Text className="text-white text-xl font-semibold ml-3 mb-1 drop-shadow-lg">
            {user?.fullName || "Vũ Trần"}
          </Text>
        </View>
      </View>

      <View className="px-4 py-4 bg-white">
        <Text className="font-bold pb-4">Thông tin cá nhân</Text>
        <View className="space-y-6">
          {/* Gender */}
          <View className="flex-row py-4 border-b border-gray-200">
            <Text className="text-gray-500 text-base w-24">Giới tính</Text>
            <Text className="text-gray-900 text-base flex-1">
              {user?.gender === "male" ? "Nam" : "Nữ"}
            </Text>
          </View>

          {/* Birth date */}
          <View className="flex-row py-4 border-b border-gray-200">
            <Text className="text-gray-500 text-base w-24">Ngày sinh</Text>
            <Text className="text-gray-900 text-base flex-1">
              {formatBirthdate(user?.birthdate) || "23/11/2003"}
            </Text>
          </View>

          {/* Phone number */}
          <View>
            <View className="flex-row pt-4">
              <Text className="text-gray-500 text-base w-24">Điện thoại</Text>
              <Text className="text-gray-900 text-base flex-1">
                {user?.phoneNumber || ""}
              </Text>
            </View>
            <Text className="text-gray-500 text-sm mt-1 ml-24">
              Số điện thoại chỉ hiển thị với người có lưu số bạn trong danh bạ
              máy
            </Text>
          </View>
        </View>

        {/* Edit button */}
        <TouchableOpacity
          className="mt-8 flex-row items-center gap-1 justify-center bg-gray-100 rounded-lg py-2"
          onPress={() => router.push("/profile/edit")}
        >
          <Ionicons name="pencil" size={16} color="black" />
          <Text className="text-base font-bold">Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
