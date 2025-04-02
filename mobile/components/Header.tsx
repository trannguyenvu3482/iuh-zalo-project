import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View, ViewProps } from "react-native";

interface HeaderProps extends ViewProps {
  title: string;
  showBackButton?: boolean;
}

const Header = ({
  title,
  showBackButton = true,
  className,
  ...props
}: HeaderProps) => {
  return (
    <View
      className={`flex-row gap-4 bg-blue-500 px-4 py-4 border-b border-gray-200 ${className || ""}`}
      style={{
        flexDirection: "row",
      }}
      {...props}
    >
      {showBackButton && (
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      <Text className="text-xl font-bold text-white">{title}</Text>
    </View>
  );
};

export default Header;
