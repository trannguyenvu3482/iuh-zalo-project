import "../global.css";

import { Stack } from "expo-router";
import { LogBox } from "react-native";

import { AuthProvider } from "~/contexts/AuthContext";

LogBox.ignoreAllLogs();

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
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
    </AuthProvider>
  );
}
