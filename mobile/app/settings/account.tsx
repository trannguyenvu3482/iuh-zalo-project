import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  divider?: boolean;
}

export default function AccountSettingsScreen() {
  const menuItems: MenuItem[] = [
    {
      id: "phone",
      icon: (
        <Ionicons name="phone-portrait-outline" size={24} color="#0066ff" />
      ),
      label: "Số điện thoại",
      description: "+84 123 456 789",
    },
    {
      id: "password",
      icon: <Ionicons name="key-outline" size={24} color="#0066ff" />,
      label: "Mật khẩu",
      description: "Đã thiết lập",
    },
    {
      id: "email",
      icon: <Ionicons name="mail-outline" size={24} color="#0066ff" />,
      label: "Email",
      description: "Chưa thiết lập",
      divider: true,
    },
    {
      id: "2fa",
      icon: (
        <Ionicons name="shield-checkmark-outline" size={24} color="#0066ff" />
      ),
      label: "Xác thực 2 lớp",
      description: "Tắt",
    },
    {
      id: "devices",
      icon: (
        <Ionicons name="phone-landscape-outline" size={24} color="#0066ff" />
      ),
      label: "Thiết bị đăng nhập",
      description: "1 thiết bị",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Menu Items */}
      <View className="flex-1">
        {menuItems.map((item) => (
          <View key={item.id}>
            <TouchableOpacity
              className="flex-row items-center bg-white px-4 py-3.5"
              onPress={() => console.log(`Navigate to ${item.id} settings`)}
            >
              <View className="w-8">{item.icon}</View>
              <View className="flex-1 ml-3">
                <Text className="text-base text-gray-900">{item.label}</Text>
                {item.description && (
                  <Text className="text-sm text-gray-500 mt-0.5">
                    {item.description}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            {item.divider && <View className="h-2 bg-gray-100" />}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
