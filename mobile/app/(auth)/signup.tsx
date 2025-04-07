import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";

import { Button } from "~/components/Button";
import Header from "~/components/Header";
import TextInput from "~/components/TextInput";

const countryCodes = [
  "+84", // Việt Nam
  "+1",  // Hoa Kỳ
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
  "+7",  // Nga
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

  // Hàm kiểm tra số điện thoại hợp lệ
  const validatePhoneNumber = (phoneNumber: string, code: string) => {
    const phoneRegexes: { [key: string]: RegExp } = {
      "+84": /^[0-9]{9}$/, // Việt Nam: 9 chữ số
      "+1": /^[0-9]{10}$/, // Hoa Kỳ: 10 chữ số
      "+44": /^[0-9]{10}$/, // Anh: 10 chữ số
      "+91": /^[0-9]{10}$/, // Ấn Độ: 10 chữ số
      "+81": /^[0-9]{10}$/, // Nhật Bản: 10 chữ số
      "+82": /^[0-9]{9,10}$/, // Hàn Quốc: 9-10 chữ số
      "+33": /^[0-9]{9}$/, // Pháp: 9 chữ số
      "+49": /^[0-9]{10}$/, // Đức: 10 chữ số
      "+61": /^[0-9]{9}$/, // Úc: 9 chữ số
      "+65": /^[0-9]{8}$/, // Singapore: 8 chữ số
      "+66": /^[0-9]{9}$/, // Thái Lan: 9 chữ số
      "+86": /^[0-9]{11}$/, // Trung Quốc: 11 chữ số
      "+7": /^[0-9]{10}$/, // Nga: 10 chữ số
      "+34": /^[0-9]{9}$/, // Tây Ban Nha: 9 chữ số
      "+39": /^[0-9]{10}$/, // Ý: 10 chữ số
      "+62": /^[0-9]{9,10}$/, // Indonesia: 9-10 chữ số
      "+60": /^[0-9]{9,10}$/, // Malaysia: 9-10 chữ số
      "+63": /^[0-9]{10}$/, // Philippines: 10 chữ số
    };

    const regex = phoneRegexes[code];
    return regex ? regex.test(phoneNumber) : false;
  };

  const handleContinue = () => {
    if (!isFormValid) return;

  // Chuyển sang màn hình tiếp theo và truyền số điện thoại qua URL
    router.push({
      pathname: "/(auth)/signup/captcha",
      params: { phone, countryCode },
    });
  };

  // Kiểm tra tính hợp lệ của biểu mẫu
  const isPhoneValid = validatePhoneNumber(phone, countryCode);
  const isFormValid = phone.length > 0 && isPhoneValid && termsAccepted && socialAccepted;

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
          <View className="flex-row items-center border border-blue-500 rounded-lg overflow-hidden">
            <View className="w-20 bg-gray-100 border-r border-blue-500 flex-row items-center justify-center">
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
            />
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
                <TouchableOpacity style={{ marginTop: 9 }}>
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
                <TouchableOpacity style={{ marginTop: 9 }}>
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