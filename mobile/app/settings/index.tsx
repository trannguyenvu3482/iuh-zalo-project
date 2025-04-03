import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  warning?: boolean;
  divider?: boolean;
  route?: string;
}

export default function SettingsScreen() {
  const menuItems: MenuItem[] = [
    {
      id: "account",
      icon: <Ionicons name="shield-outline" size={24} color="#0066ff" />,
      label: "Tài khoản và bảo mật",
      route: "/settings/account",
    },
    {
      id: "privacy",
      icon: <Ionicons name="lock-closed-outline" size={24} color="#0066ff" />,
      label: "Quyền riêng tư",
      route: "/settings/privacy",
    },
    {
      id: "storage",
      icon: <Ionicons name="time-outline" size={24} color="#f59e0b" />,
      label: "Dữ liệu trên máy",
      warning: true,
      route: "/settings/storage",
    },
    {
      id: "backup",
      icon: <Ionicons name="sync-outline" size={24} color="#0066ff" />,
      label: "Sao lưu và khôi phục",
      divider: true,
      route: "/settings/backup",
    },
    {
      id: "notifications",
      icon: <Ionicons name="notifications-outline" size={24} color="#0066ff" />,
      label: "Thông báo",
      route: "/settings/notifications",
    },
    {
      id: "messages",
      icon: <Ionicons name="chatbubble-outline" size={24} color="#0066ff" />,
      label: "Tin nhắn",
      route: "/settings/messages",
    },
    {
      id: "calls",
      icon: <Ionicons name="call-outline" size={24} color="#0066ff" />,
      label: "Cuộc gọi",
      route: "/settings/calls",
    },
    {
      id: "diary",
      icon: <Ionicons name="book-outline" size={24} color="#0066ff" />,
      label: "Nhật ký",
      route: "/settings/diary",
    },
    {
      id: "contacts",
      icon: <Ionicons name="people-outline" size={24} color="#0066ff" />,
      label: "Danh bạ",
      divider: true,
      route: "/settings/contacts",
    },
    {
      id: "display",
      icon: <Ionicons name="color-palette-outline" size={24} color="#0066ff" />,
      label: "Giao diện và ngôn ngữ",
      route: "/settings/display",
    },
    {
      id: "about",
      icon: (
        <Ionicons name="information-circle-outline" size={24} color="#0066ff" />
      ),
      label: "Thông tin về Zalo",
      route: "/settings/about",
    },
    {
      id: "support",
      icon: <Ionicons name="help-circle-outline" size={24} color="#0066ff" />,
      label: "Liên hệ hỗ trợ",
      route: "/settings/support",
    },
    {
      id: "switch",
      icon: (
        <Ionicons name="swap-horizontal-outline" size={24} color="#0066ff" />
      ),
      label: "Chuyển tài khoản",
      route: "/settings/switch",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-2.5 bg-primary">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl text-white font-medium">Cài đặt</Text>
        <TouchableOpacity className="ml-auto">
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <ScrollView className="flex-1">
        {menuItems.map((item) => (
          <View key={item.id}>
            <TouchableOpacity
              className="flex-row items-center bg-white p-4 border-b border-b-gray-100"
              onPress={() =>
                item.route &&
                router.push({
                  pathname: item.route as any,
                })
              }
            >
              <View className="w-8">{item.icon}</View>
              <Text className="flex-1 text-lg text-gray-900 ml-3">
                {item.label}
              </Text>
              {item.warning && (
                <View className="mr-2">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            {item.divider && <View className="h-2 bg-gray-100" />}
          </View>
        ))}
        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="bg-primary py-4 px-8 m-4 rounded-lg"
        >
          <Text className="text-white text-center text-xl font-bold">
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
