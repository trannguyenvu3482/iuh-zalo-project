import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MenuItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  customIcon?: boolean;
  title: string;
  subtitle?: string;
  showArrow?: boolean;
  badge?: {
    type: "dot";
    color: string;
  };
};

const menuItems: MenuItem[] = [
  {
    id: "zalo-video",
    icon: "play",
    customIcon: true,
    title: "Zalo Video",
    subtitle: "❤️ Bạn bè của bạn thích video này",
    badge: {
      type: "dot",
      color: "#ef4444",
    },
  },
  {
    id: "game-center",
    icon: "game-controller",
    title: "Game Center",
    showArrow: true,
  },
  {
    id: "life-services",
    icon: "calendar",
    title: "Dịch vụ đời sống",
    subtitle: "Nạp điện thoại, Đò vé số, Lịch bóng đá, ...",
    showArrow: true,
  },
  {
    id: "financial",
    icon: "grid",
    title: "Tiện ích tài chính",
  },
  {
    id: "public-services",
    icon: "business",
    title: "Dịch vụ công",
  },
  {
    id: "mini-app",
    icon: "apps",
    title: "Mini App",
    showArrow: true,
  },
];

const Apps = () => {
  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      className="flex-row items-center px-4 py-3 bg-white"
    >
      {item.customIcon ? (
        <View className="w-10 h-10 rounded-xl bg-blue-500 items-center justify-center">
          <Ionicons name={item.icon} size={20} color="white" />
        </View>
      ) : (
        <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center">
          <Ionicons
            name={item.icon}
            size={20}
            color={item.iconColor || "#3b82f6"}
          />
        </View>
      )}
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="text-base text-gray-900">{item.title}</Text>
          {item.badge && (
            <View
              className="w-2 h-2 rounded-full ml-2"
              style={{ backgroundColor: item.badge.color }}
            />
          )}
        </View>
        {item.subtitle && (
          <Text className="text-sm text-gray-500 mt-0.5">{item.subtitle}</Text>
        )}
      </View>
      {item.showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Menu Items */}
        <View>
          {menuItems.map((item, index) => (
            <View key={item.id}>
              {renderMenuItem(item)}
              {index < menuItems.length - 1 && (
                <View className="h-px bg-gray-100 ml-[68px]" />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Apps;
