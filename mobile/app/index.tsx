import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { useUserStore } from "~/store/userStore";

export default function Index() {
  const { isAuthenticated } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Simulate checking authentication state
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Show a loading screen while checking authentication
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4361ee" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  return isAuthenticated ? (
    <Redirect href="/(root)/messages" />
  ) : (
    <Redirect href="/(auth)/welcome" />
  );
}
