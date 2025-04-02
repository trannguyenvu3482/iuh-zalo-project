import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const SearchHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const currentTab = pathname.split("/").pop();
  const [isSearchActive, setIsSearchActive] = useState(false);

  const handleSearchPress = () => {
    setIsSearchActive(true);
  };

  const handleBackPress = () => {
    setIsSearchActive(false);
  };

  const renderRightButtons = () => {
    if (isSearchActive) {
      return (
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="ml-4"
        >
          <MaterialCommunityIcons name="qrcode-scan" size={20} color="white" />
        </TouchableOpacity>
      );
    }

    switch (currentTab) {
      case "messages":
      case "contacts":
      case "apps":
        return (
          <View className="flex-row items-center">
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="mr-4"
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={20}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        );
      case "journal":
        return (
          <View className="flex-row items-center">
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="mr-4"
            >
              <Ionicons name="image-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="relative"
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">2</Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      case "profile":
        return (
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View
      className={`flex-row items-center justify-between px-4 bg-primary border-b border-gray-200 ${isSearchActive ? "py-2" : "py-3"}`}
    >
      <View className="flex-row items-center flex-1">
        {isSearchActive ? (
          <>
            <TouchableOpacity
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="mr-3"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 mr-2">
              <Ionicons name="search" size={18} color="black" />
              <TextInput
                style={{
                  paddingVertical: 4,
                }}
                placeholder="Tìm kiếm"
                placeholderTextColor="#9CA3AF"
                className=" text-gray-800 ml-2 text-lg"
                autoFocus
              />
            </View>
          </>
        ) : (
          <TouchableOpacity
            onPress={handleSearchPress}
            className="flex-row items-center"
          >
            <Ionicons name="search" size={20} color="white" />
            <Text className="ml-2 text-lg font-semibold text-gray-800 opacity-45">
              Tìm kiếm
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {renderRightButtons()}
    </View>
  );
};

export default SearchHeader;
