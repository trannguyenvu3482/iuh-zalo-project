import { Stack } from "expo-router";

const ResetPassLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
      }}
    >
      <Stack.Screen name="findPhoneNum" />
      <Stack.Screen name="capchaResetPass" />
    </Stack>
  );
};

export default ResetPassLayout;
