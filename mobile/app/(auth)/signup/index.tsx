import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import PhoneInput from "react-native-phone-number-input";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "~/components/Button";
import Header from "~/components/Header";
import PhoneNumberInput from "~/components/auth/PhoneNumberInput";
import { useSignupStore } from "~/store/signupStore";
const Signup = () => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [socialAccepted, setSocialAccepted] = useState(false);
  const router = useRouter();
  const phoneInputRef = useRef<PhoneInput>(null);
  const { setPhone: setPhoneStore } = useSignupStore();
  const [formattedValue, setFormattedValue] = useState("");

  console.log(
    phoneInputRef.current?.getNumberAfterPossiblyEliminatingZero()
      .formattedNumber,
  );

  const isFormValid =
    phoneInputRef.current?.isValidNumber(formattedValue) &&
    termsAccepted &&
    socialAccepted;

  const handleContinue = () => {
    if (!isFormValid) return;

    setPhoneStore(
      phoneInputRef.current?.getNumberAfterPossiblyEliminatingZero()
        ?.formattedNumber || "",
    );
    router.push("/(auth)/signup/captcha");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header title="Đăng ký" showBackButton />
      <View className="flex-1 px-4">
        <View className="items-center mt-8 mb-6">
          <Text className="text-2xl font-bold text-gray-800">
            Nhập số điện thoại
          </Text>
        </View>

        <View className="w-full gap-6">
          <PhoneNumberInput
            phoneInputRef={phoneInputRef}
            formattedValue={formattedValue}
            setFormattedValue={setFormattedValue}
          />

          <View className="gap-4">
            {/* Điều khoản sử dụng Zalo */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => setTermsAccepted(!termsAccepted)}
                className="flex-row items-center"
              >
                <View
                  className={`w-5 h-5 rounded border ${
                    termsAccepted
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-400"
                  } items-center justify-center`}
                >
                  {termsAccepted && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Text className="text-gray-800">Tôi đồng ý với các </Text>
                <TouchableOpacity>
                  <Text className="text-blue-500">điều khoản sử dụng Zalo</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Điều khoản Mạng xã hội của Zalo */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => setSocialAccepted(!socialAccepted)}
                className="flex-row items-center"
              >
                <View
                  className={`w-5 h-5 rounded border ${
                    socialAccepted
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-400"
                  } items-center justify-center`}
                >
                  {socialAccepted && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Text className="text-gray-800">Tôi đồng ý với </Text>
                <TouchableOpacity>
                  <Text className="text-blue-500">
                    điều khoản Mạng xã hội của Zalo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
