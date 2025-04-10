import { Stack } from "expo-router";

const SignupLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="createName" />
      <Stack.Screen name="birthdayAndGender" />
      <Stack.Screen name="createAvatar" />
      <Stack.Screen name="createPassword" />
    </Stack>
  );
};

export default SignupLayout;
