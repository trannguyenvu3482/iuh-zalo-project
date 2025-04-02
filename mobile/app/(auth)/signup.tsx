import { Link } from "expo-router";
import { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "~/components/Button";
import Header from "~/components/Header";
import { images } from "~/constants/images";

const Signup = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = () => {
    // TODO: Implement signup logic
    console.log("Signup with:", { phone, password, confirmPassword });
  };

  return (
    <SafeAreaView className="flex-1">
      <Header title="Đăng ký" />
      <View className="flex-1 items-center justify-center px-4">
        <Image
          className="w-[140px] h-auto object-cover mb-10"
          source={images.zaloLogo}
          resizeMode="contain"
        />

        <View className="w-full gap-4">
          <View className="gap-2">
            <Text className="text-gray-700">Số điện thoại</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3"
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View className="gap-2">
            <Text className="text-gray-700">Mật khẩu</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3"
              placeholder="Nhập mật khẩu"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View className="gap-2">
            <Text className="text-gray-700">Xác nhận mật khẩu</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3"
              placeholder="Nhập lại mật khẩu"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <Button
            onPress={handleSignup}
            title="Đăng ký"
            type="primary"
            className="mt-4"
          />
        </View>

        <View className="flex-row items-center justify-center mt-8">
          <Text className="text-gray-500">Đã có tài khoản? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-blue-500">Đăng nhập</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Signup;
