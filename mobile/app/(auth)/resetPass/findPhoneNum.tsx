import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const FindPhoneNum = () => {
  const router = useRouter();
  const { phoneNumber: initialPhoneNumber, verified } = useLocalSearchParams(); // Lấy tham số từ router

  // Xử lý trường hợp phoneNumber là mảng hoặc chuỗi
  const phoneNumber = Array.isArray(initialPhoneNumber)
    ? initialPhoneNumber[0] // Lấy phần tử đầu tiên nếu là mảng
    : initialPhoneNumber || ""; // Nếu không, sử dụng giá trị chuỗi hoặc chuỗi rỗng

  const [inputPhoneNumber, setInputPhoneNumber] = useState(phoneNumber); // Gán số điện thoại nếu có

  const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const handleNext = () => {
    router.push({
      pathname: "/(auth)/resetPass/capchaResetPass",
      params: { phoneNumber: inputPhoneNumber },
    });
  };

  const isPhoneNumberValid = isValidPhoneNumber(inputPhoneNumber);

  useEffect(() => {
    if (verified === "true") {
      // Hiển thị thông báo xác nhận khi quay lại từ Captcha
      Alert.alert(
        `Xác nhận số điện thoại (${inputPhoneNumber})?`,
        "Số điện thoại này sẽ được sử dụng để nhận mã xác thực",
        [
          {
            text: "HỦY",
            style: "cancel",
          },
          {
            text: "XÁC NHẬN",
            onPress: () => {
              // Điều hướng đến màn hình nhập mã xác thực
              router.push({
                pathname: "/(auth)/resetPass/verifyResetPass",
                params: { phoneNumber: inputPhoneNumber },
              });
            },
          },
        ]
      );
    }
  }, [verified]);

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-500 py-4 px-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-white text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Lấy lại mật khẩu</Text>
      </View>

      {/* Content */}
      <View className="px-4 py-6">
        <Text className="text-gray-500 mb-6">
          Nhập số điện thoại để lấy lại mật khẩu
        </Text>

        <TextInput
          placeholder="Số điện thoại"
          keyboardType="phone-pad"
          value={inputPhoneNumber}
          onChangeText={setInputPhoneNumber}
          className="border-b border-blue-500 text-black text-lg pb-2"
        />
      </View>

      {/* Next Button */}
      <TouchableOpacity
        onPress={handleNext}
        disabled={!isPhoneNumberValid}
        className={`absolute bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center ${
          isPhoneNumberValid ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        <Text className="text-white text-2xl">→</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FindPhoneNum;