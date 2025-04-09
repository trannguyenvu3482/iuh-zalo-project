import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="account"
        options={{
          title: "Tài khoản và bảo mật",
          headerTitleStyle: {
            fontSize: 17,
          },
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          title: "Quyền riêng tư",
          headerTitleStyle: {
            fontSize: 17,
          },
        }}
      />
      <Stack.Screen
        name="storage"
        options={{
          title: "Dữ liệu trên máy",
          headerTitleStyle: {
            fontSize: 17,
          },
        }}
      />
      {/* Add more screens as needed */}
    </Stack>
  );
}
