import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import PhoneInput from "react-native-phone-number-input";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "~/components/Button";
import Header from "~/components/Header";
import PhoneNumberInput from "~/components/auth/PhoneNumberInput";
const countryCodes = [
  "+84", // Việt Nam
  "+1", // Hoa Kỳ
  "+44", // Anh
  "+91", // Ấn Độ
  "+81", // Nhật Bản
  "+82", // Hàn Quốc
  "+33", // Pháp
  "+49", // Đức
  "+61", // Úc
  "+65", // Singapore
  "+66", // Thái Lan
  "+86", // Trung Quốc
  "+7", // Nga
  "+34", // Tây Ban Nha
  "+39", // Ý
  "+62", // Indonesia
  "+60", // Malaysia
  "+63", // Philippines
];

const Signup = () => {
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+84"); // Mã quốc gia mặc định là Việt Nam
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [socialAccepted, setSocialAccepted] = useState(false);
  const router = useRouter();
  const phoneInputRef = useRef<PhoneInput>(null);

  const handleContinue = () => {
    if (!phoneInputRef.current?.isValidNumber) return;

    // Chuyển sang màn hình tiếp theo và truyền số điện thoại qua URL
    router.push({
      pathname: "/(auth)/signup/captcha",
      params: { phone, countryCode },
    });
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
          <View className="flex-row items-center rounded-lg overflow-hidden">
            <PhoneNumberInput phoneInputRef={phoneInputRef} />
            {/* <View className="w-20 bg-gray-100 border-r border-blue-500 flex-row items-center justify-center">
              <Picker
                selectedValue={countryCode}
                onValueChange={(itemValue) => setCountryCode(itemValue)}
                style={{
                  width: "100%",
                  height: 50,
                  backgroundColor: "transparent",
                }}
                dropdownIconColor="blue"
              >
                {countryCodes.map((code) => (
                  <Picker.Item key={code} label={code} value={code} />
                ))}
              </Picker>
            </View>
            <TextInput
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              className="flex-1 text-black px-4"
            /> */}
          </View>

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
              <Text className="text-gray-800">
                Tôi đồng ý với các{" "}
                <TouchableOpacity style={{ marginTop: 1 }}>
                  <Text className="text-blue-500">điều khoản sử dụng Zalo</Text>
                </TouchableOpacity>
              </Text>
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
              <Text className="text-gray-800">
                Tôi đồng ý với{" "}
                <TouchableOpacity style={{ marginTop: 1 }}>
                  <Text className="text-blue-500">
                    điều khoản Mạng xã hội của Zalo
                  </Text>
                </TouchableOpacity>
              </Text>
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
