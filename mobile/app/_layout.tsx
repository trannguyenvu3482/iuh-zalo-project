import "../global.css";

import { Stack } from "expo-router";
import { LogBox } from "react-native";

import { useSocket } from "~/hooks/useSocket";
import { useAuthStore } from "~/store/authStore";

LogBox.ignoreAllLogs();

export default function RootLayout() {
  const { token } = useAuthStore();
  const { sendMessage, markMessageAsRead } = useSocket(token);

  return (
    <Stack>
      <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
