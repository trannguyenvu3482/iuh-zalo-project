import { Link } from "expo-router";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "~/components/Button";
import Header from "~/components/Header";
import TextInput from "~/components/TextInput";
import { images } from "~/constants/images";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // TODO: Implement login logic
    console.log("Login with:", { phone, password });
  };

  return (
    <SafeAreaView className="flex-1">
      <Header title="Đăng nhập" showBackButton={false} className="bg-white" />
      <View className="flex-1 items-center justify-center px-4">
        <Image
          className="w-[140px] h-auto object-cover mb-10"
          source={images.zaloLogo}
          resizeMode="contain"
        />

        <View className="w-full gap-4">
          <TextInput
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TextInput
            placeholder="Mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity className="items-end">
            <Text className="text-blue-500">Quên mật khẩu?</Text>
          </TouchableOpacity>

          <Button
            onPress={handleLogin}
            title="Đăng nhập"
            type="primary"
            className="mt-4"
          />
        </View>

        <View className="flex-row items-center justify-center mt-8">
          <Text className="text-gray-500">Chưa có tài khoản? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text className="text-blue-500">Đăng ký</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;
