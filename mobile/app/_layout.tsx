import "../global.css";

import { Stack } from "expo-router";
import { LogBox } from "react-native";

LogBox.ignoreAllLogs();

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Home", headerShown: false }}
      />
      <Stack.Screen
        name="(auth)"
        options={{ title: "Auth", headerShown: false }}
      />
      <Stack.Screen
        name="(root)"
        options={{ title: "Root", headerShown: false }}
      />
      <Stack.Screen
        name="chat"
        options={{ title: "Chat", headerShown: false }}
      />
      <Stack.Screen
        name="profile"
        options={{ title: "Profile", headerShown: false }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: "Settings", headerShown: false }}
      />
    </Stack>
  );
}
