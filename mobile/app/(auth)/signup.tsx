import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "~/components/Button";
import Header from "~/components/Header";
import TextInput from "~/components/TextInput";

const Signup = () => {
  const [phone, setPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [socialAccepted, setSocialAccepted] = useState(false);

  const handleContinue = () => {
    // TODO: Implement continue logic
    console.log("Continue with:", { phone, termsAccepted, socialAccepted });
  };

  const isFormValid = phone.length > 0 && termsAccepted && socialAccepted;

  return (
    <SafeAreaView className="flex-1">
      <Header title="Đăng ký" showBackButton />
      <View className="flex-1 px-4">
        <View className="items-center mt-8 mb-6">
          <Text className="text-2xl font-bold text-gray-800">
            Nhập số điện thoại
          </Text>
        </View>

        <View className="w-full gap-6">
          <TextInput
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <View className="gap-4">
            <TouchableOpacity
              className="flex-row items-start gap-2"
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              <View
                className={`w-5 h-5 rounded border ${termsAccepted ? "bg-blue-500 border-blue-500" : "border-gray-400"} items-center justify-center mt-0.5`}
              >
                {termsAccepted && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
              <Text className="flex-1 ">
                Tôi đồng ý sử dụng các{" "}
                <Text className="text-blue-500">điều khoản sử dụng Zalo</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-start gap-2"
              onPress={() => setSocialAccepted(!socialAccepted)}
            >
              <View
                className={`w-5 h-5 rounded border ${socialAccepted ? "bg-blue-500 border-blue-500" : "border-gray-400"} items-center justify-center mt-0.5`}
              >
                {socialAccepted && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
              <Text className="flex-1">
                Tôi đồng ý với{" "}
                <Text className="text-blue-500">
                  điều khiển Mạng xã hội của Zalo
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            onPress={handleContinue}
            title="Tiếp tục"
            type={isFormValid ? "primary" : "secondary"}
            disabled={!isFormValid}
            className="mt-4"
          />
        </View>

        <View className="flex-row items-center justify-center mt-auto mb-8">
          <Text className="text-gray-500">Bạn đã có tài khoản? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-blue-500 font-bold">Đăng nhập ngay</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Signup;
