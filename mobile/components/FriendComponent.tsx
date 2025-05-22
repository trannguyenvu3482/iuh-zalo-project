import React from "react";
import { TouchableOpacity, View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface FriendComponentProps {
    id: string;
    avatar?: string;
    name: string;
    onPress?: () => void;
}

const FriendComponent = ({
    id,
    avatar,
    name,

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
            <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                {avatar ? (
                    <Image
                        source={{ uri: avatar }}
                        className="w-full h-full rounded-full"
                    />
                ) : (
                    <Ionicons name="person" size={24} color="#9CA3AF" />
                )}
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