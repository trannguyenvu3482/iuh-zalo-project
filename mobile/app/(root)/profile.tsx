import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUserStore } from "~/store/userStore";

type MenuItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  warning?: boolean;
  addGap?: boolean;
};

const menuItems: MenuItem[] = [
  {
    id: "zcloud",
    icon: "cloud",
    title: "zCloud",
    subtitle: "Không gian lưu trữ dữ liệu trên đám mây",
    rightIcon: "chevron-forward",
  },
  {
    id: "zstyle",
    icon: "brush",
    title: "zStyle – Nổi bật trên Zalo",
    subtitle: "Hình nền và nhạc cho cuộc gọi Zalo",
    addGap: true,
  },
  {
    id: "my-cloud",
    icon: "cloud-outline",
    title: "Cloud của tôi",
    subtitle: "Lưu trữ các tin nhắn quan trọng",
    rightIcon: "chevron-forward",
  },
  {
    id: "device-storage",
    icon: "time-outline",
    title: "Dữ liệu trên máy",
    subtitle: "Dung lượng điện thoại sắp đầy",
    rightIcon: "chevron-forward",
    warning: true,
  },
  {
    id: "qr",
    icon: "qr-code",
    title: "Ví QR",
    subtitle: "Lưu trữ và xuất trình các mã QR quan trọng",
    rightIcon: "chevron-forward",
    addGap: true,
  },
  {
    id: "security",
    icon: "shield-outline",
    title: "Tài khoản và bảo mật",
    rightIcon: "chevron-forward",
  },
  {
    id: "privacy",
    icon: "lock-closed-outline",
    title: "Quyền riêng tư",
    rightIcon: "chevron-forward",
  },
];

const Profile = () => {
  const { user } = useUserStore();
  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      className="flex-row items-center px-4 py-3 bg-white"
    >
      <View className="w-8 h-8 rounded-xl bg-gray-100 items-center justify-center">
        <Ionicons
          name={item.icon}
          size={20}
          color={item.warning ? "#f59e0b" : "#3b82f6"}
        />
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="text-lg text-gray-900">{item.title}</Text>
          {item.warning && (
            <View className="ml-2">
              <Ionicons name="warning" size={16} color="#f59e0b" />
            </View>
          )}
        </View>
        {item.subtitle && (
          <Text className="text-base text-gray-500">{item.subtitle}</Text>
        )}
      </View>
      {item.rightIcon && (
        <Ionicons name={item.rightIcon} size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <ScrollView>
        {/* Profile Section */}
        <TouchableOpacity
          className="flex-row items-center px-4 py-4 bg-white mb-2"
          onPress={() =>
            router.push({
              pathname: "/profile/[id]",
              params: { id: user?.id },
            })
          }
        >
          <Image
            source={{ uri: user?.avatar || "https://picsum.photos/200/200" }}
            className="w-16 h-16 rounded-full border-2 border-gray-200"
          />
          <View className="flex-1 ml-3">
            <Text className="text-xl font-medium text-gray-900">
              {user?.fullName}
            </Text>
            <Text className="text-sm text-gray-500">Xem trang cá nhân</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Menu Items */}
        <View>
          {menuItems.map((item, index) => (
            <View key={item.id}>
              <View className="bg-white">
                {renderMenuItem(item)}
                {index < menuItems.length - 1 && !item.addGap && (
                  <View className="h-px bg-gray-100 ml-[60px]" />
                )}
              </View>
              {item.addGap && <View className="h-4 bg-gray-100" />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
