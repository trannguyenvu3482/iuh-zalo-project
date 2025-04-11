import { Stack } from "expo-router";

const AuthLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
    </Stack>
  );
};

export default AuthLayout;
