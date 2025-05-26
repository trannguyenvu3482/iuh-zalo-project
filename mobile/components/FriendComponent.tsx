import React from "react";
import { TouchableOpacity, View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface FriendComponentProps {
    id: string;
    avatar?: string;
    name: string;
    status?: string;
    onPress?: () => void;
}

const FriendComponent = ({
    id,
    avatar,
    name,
    status,
    onPress,
}: FriendComponentProps) => {
    const router = useRouter();

    const handlePress = () => {
        onPress?.();
        router.push({
            pathname: "/chat/[id]",
            params: { id },
        });
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            className="flex-row items-center px-4 py-3 border-b border-gray-100"
        >
            {/* Avatar */}
           {/* Avatar */}
<View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3 relative">
    {avatar ? (
        <Image
            source={{ uri: avatar }}
            className="w-full h-full rounded-full"
        />
    ) : (
        <Ionicons name="person" size={24} color="#9CA3AF" />
    )}
    {/* Chấm trạng thái */}
    <View
        style={{
            position: "absolute",
            bottom: 2,
            right: 2,
            width: 12,
            height: 12,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: "#fff",
            backgroundColor: status === "active" ? "#22c55e" : "#d1d5db", // xanh nếu online, xám nếu offline
        }}
    />
</View>

            {/* Content */}
            <View className="flex-1">
                <Text
                    className="text-lg font-medium text-gray-900"
                    numberOfLines={1}
                >
                    {name}
                </Text>

            </View>
        </TouchableOpacity>
    );
};

export default FriendComponent;