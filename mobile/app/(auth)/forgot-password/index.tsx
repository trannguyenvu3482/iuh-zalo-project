import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { userAPI } from "~/api";
import Header from "~/components/Header";
import TextInput from "~/components/TextInput";

const ForgotPassword = () => {
  const [phone, setPhone] = useState("");

  const handleContinue = async () => {
    if (!phone) {
      Alert.alert("Vui lòng nhập số điện thoại");
      return;
    }

    const response = await userAPI.searchUserByPhoneNumberPublic(phone);

    console.log("response", response);

    if (response.statusCode === 200) {
      router.push("/(auth)/forgot-password/otp");
    } else {
      Alert.alert("Số điện thoại không tồn tại", "Vui lòng kiểm tra lại");
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <Header
        title="Quên mật khẩu"
        showBackButton
        onBackPress={() => router.replace("/")}
      />
      <View className="bg-gray-100 w-full p-4">
        <Text>Vui lòng nhập số điện thoại để lấy lại mật khẩu</Text>
      </View>
      <View className="flex-1 items-center px-4 mt-4">
        <View className="w-full gap-4 flex-1">
          <TextInput
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View className="w-full flex-row items-center justify-between mt-8 mb-4">
          <TouchableOpacity className="flex-row items-center gap-1" />

          <TouchableOpacity
            onPress={handleContinue}
            disabled={false}
            className="w-12 h-12 rounded-full items-center justify-center bg-blue-500"
          >
            <Ionicons name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPassword;
