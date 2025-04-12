import { Stack } from "expo-router";

const ForgotPasswordLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
};

export default ForgotPasswordLayout;
