import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUserStore } from "../../store/userStore";

interface ProfileAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useUserStore();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (id && user) {
      console.log("id", id);
      console.log("user", user.id);
      setIsOwnProfile(id === user.id);
      setProfileUser(user);
      setIsLoading(false);
    }
  }, [id, user]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text>User not found</Text>
      </View>
    );
  }

  const profileActions: ProfileAction[] = [
    {
      id: "style",
      icon: <Ionicons name="color-palette-outline" size={24} color="#666" />,
      label: "Cài ZStyle",
      onPress: () => console.log("Open ZStyle"),
    },
    {
      id: "photos",
      icon: <Ionicons name="images-outline" size={24} color="#666" />,
      label: "Ảnh của tôi",
      onPress: () => console.log("Open Photos"),
    },
    {
      id: "storage",
      icon: <Ionicons name="folder-outline" size={24} color="#666" />,
      label: "Kho",
      onPress: () => console.log("Open Storage"),
    },
  ];

  return (
    <View className="flex-1 bg-gray-100">
      {/* Transparent Header */}
      <SafeAreaView className="absolute top-0 left-0 right-0 z-10">
        <View className="flex-row justify-between items-center px-4 py-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          {!isOwnProfile ? (
            <View className="flex-row gap-6 items-center">
              <TouchableOpacity>
                <Ionicons name="call-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="videocam-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-6 items-center">
              <TouchableOpacity>
                <Ionicons name="time-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/profile/menu")}>
                <Ionicons name="ellipsis-horizontal" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      <ScrollView bounces={false}>
        {/* Profile Cover & Avatar */}
        <View>
          <View className="h-60 bg-gray-100">
            <Image
              source={{ uri: "https://picsum.photos/800/400" }}
              className="w-full h-full"
            />
          </View>
          <View className="items-center -mt-16">
            <Image
              source={{
                uri: profileUser.avatar || "https://picsum.photos/300/300",
              }}
              className="w-32 h-32 rounded-full border-4 border-white"
            />
            <View className="flex-row items-center gap-2 mt-2">
              <Text className="text-2xl font-bold">{profileUser.fullName}</Text>
            </View>
            {isOwnProfile && (
              <TouchableOpacity
                className="flex-row items-center gap-2 mt-2"
                onPress={() => router.push("/profile/edit")}
              >
                <Text className="text-primary">
                  Cập nhật trạng thái cá nhân
                </Text>
                <Ionicons name="pencil" size={14} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isOwnProfile ? (
          <>
            {/* Profile Actions */}
            <View className="flex-row justify-between px-4 mt-6">
              {profileActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  className="bg-white rounded-xl py-3 px-6 items-center flex-1 mx-1"
                  onPress={action.onPress}
                >
                  {action.icon}
                  <Text className="mt-1 text-sm text-gray-600">
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status/Diary Section */}
            <View className="mt-6 mx-4 bg-white rounded-xl p-4">
              <Text className="text-lg font-medium mb-2">
                Hôm nay {profileUser.fullName} có gì vui?
              </Text>
              <Text className="text-gray-500">
                Đây là Nhật ký của bạn - Hãy làm đầy Nhật ký với những dấu ấn
                cuộc đời và kỷ niệm đáng nhớ nhé!
              </Text>
            </View>
          </>
        ) : (
          <>
            <View className="mt-6 mx-4">
              <Text className="text-gray-500 text-center">
                {profileUser.fullName} chưa có hoạt động nào.{"\n"}
                Hãy trò chuyện để hiểu nhau hơn.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {!isOwnProfile && (
        <SafeAreaView className="pb-4 px-4 items-end">
          <TouchableOpacity
            className="bg-primary rounded-full px-4 py-2 items-center flex-row gap-2"
            onPress={() => router.push("/chat/1")}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="white" />
            <Text className="text-white font-medium text-base">Nhắn tin</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}
