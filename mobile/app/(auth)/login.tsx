import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "~/components/Header";
import TextInput from "~/components/TextInput";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleNext = () => {
    if (phone === "1" && password === "1") {
      router.replace("/(root)/messages");
    } else {
      console.log("Login with:", { phone, password });
    }
  };

  const isFormValid = phone.length > 0 && password.length > 0;

  return (
    <SafeAreaView className="flex-1">
      <Header title="Đăng nhập" showBackButton />
      <View className="bg-gray-100 w-full p-4">
        <Text>Vui lòng nhập số điện thoại và mật khẩu để đăng nhập</Text>
      </View>
      <View className="flex-1 items-center px-4 mt-4">
        <View className="w-full gap-4 flex-1">
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

          <TouchableOpacity className="items-start">
            <Text className="text-blue-500">Lấy lại mật khẩu</Text>
          </TouchableOpacity>
        </View>

        <View className="w-full flex-row items-center justify-between mt-8 mb-4">
          <TouchableOpacity className="flex-row items-center gap-1">
            <Text className="text-gray-500">Câu hỏi thường gặp</Text>
            <Ionicons name="chevron-forward" size={14} color="#aaa" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            disabled={!isFormValid}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              isFormValid ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <Ionicons name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;
