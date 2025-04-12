import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Header from "~/components/Header";
import { useUserStore } from "~/store/userStore";

interface MenuItem {
  id: string;
  label: string;
  route: string;
  isSection?: boolean;
}

export default function ProfileMenu() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();

  const menuItems: MenuItem[] = [
    {
      id: "info",
      label: "Thông tin",
      route: "/profile/info",
    },
    {
      id: "avatar",
      label: "Đổi ảnh đại diện",
      route: "/profile/avatar",
    },
    {
      id: "cover",
      label: "Đổi ảnh bìa",
      route: "/profile/cover",
    },
    {
      id: "bio",
      label: "Cập nhật giới thiệu bản thân",
      route: "/profile/bio",
    },
    {
      id: "wallet",
      label: "Ví của tôi",
      route: "/profile/wallet",
    },
    {
      id: "settings-section",
      label: "Cài đặt",
      route: "",
      isSection: true,
    },
    {
      id: "qr",
      label: "Mã QR của tôi",
      route: "/profile/qr",
    },
    {
      id: "privacy",
      label: "Quyền riêng tư",
      route: "/profile/privacy",
    },
    {
      id: "account",
      label: "Quản lý tài khoản",
      route: "/profile/account",
    },
    {
      id: "general",
      label: "Cài đặt chung",
      route: "/profile/general",
    },
  ];

  return (
    <View className="flex-1 bg-white" style={{ paddingBottom: insets.bottom }}>
      <Header title={user?.fullName} showBackButton />
      <ScrollView>
        {menuItems.map((item) =>
          item.isSection ? (
            <>
              <View key={item.id} className="bg-gray-100 px-4 py-2" />
              <View key={item.id} className="px-4 pt-4 pb-2">
                <Text className="text-sm font-bold text-primary">
                  {item.label}
                </Text>
              </View>
            </>
          ) : (
            <TouchableOpacity
              key={item.id}
              className="flex-row items-center px-4 py-3 border-b border-gray-100"
              onPress={() => router.push(item.route)}
            >
              <Text className="text-base text-gray-800">{item.label}</Text>
            </TouchableOpacity>
          ),
        )}
      </ScrollView>
    </View>
  );
}
