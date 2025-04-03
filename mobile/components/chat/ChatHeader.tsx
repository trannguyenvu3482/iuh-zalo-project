import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

interface ChatHeaderProps {
  name: string;
  isStranger?: boolean;
}

export default function ChatHeader({
  name,
  isStranger = false,
}: ChatHeaderProps) {
  const router = useRouter();

  return (
    <>
      <View className="bg-primary">
        <View className="flex-row items-center justify-between px-4 py-2">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/profile/[id]",
                  params: { id: name },
                })
              }
            >
              <Text className="text-xl text-white">{name}</Text>
              {isStranger && (
                <View className="flex-row">
                  <View className="bg-white rounded-lg">
                    <Text className="text-primary px-2 py-[3px] font-semibold text-sm">
                      NGƯỜI LẠ
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity className="mr-5">
              <Ionicons name="call-outline" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="mr-5">
              <Ionicons name="videocam-outline" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="list-outline" size={26} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {isStranger && (
        <View className="px-4 py-3 bg-white border-b border-gray-100">
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="person-add-outline"
              size={20}
              color="gray"
              className="mr-2"
            />
            <Text className="text-gray-600">Đã gửi lời mời kết bạn</Text>
          </View>
        </View>
      )}
    </>
  );
}
