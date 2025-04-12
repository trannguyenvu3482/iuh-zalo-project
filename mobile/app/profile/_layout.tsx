import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="menu" />
      <Stack.Screen name="info" />
      <Stack.Screen name="edit" />
      {/* <Stack.Screen name="avatar" />
      <Stack.Screen name="cover" />
      <Stack.Screen name="bio" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="qr" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="account" />
      <Stack.Screen name="general" /> */}
    </Stack>
  );
}
