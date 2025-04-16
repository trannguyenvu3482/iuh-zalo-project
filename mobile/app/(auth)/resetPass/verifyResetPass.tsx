import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const VerifyResetPass = () => {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams(); // Lấy số điện thoại từ tham số truyền vào
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // State lưu từng ký tự OTP
  const correctOtp = "123456"; // Mã OTP mặc định để xác thực

  // Khai báo kiểu cho inputs
  const inputs: Record<string, TextInput | null> = {}; // Để lưu tham chiếu đến các TextInput

  const handleVerify = () => {
    const otpCode = otp.join(""); // Ghép các ký tự thành chuỗi
    if (otpCode === correctOtp) {
      // Xử lý xác thực OTP thành công
      Alert.alert("Thành công", "Mã xác thực hợp lệ!", [
        {
          text: "OK",
          onPress: () => {
            // Điều hướng đến màn hình đặt lại mật khẩu
            router.push("/(auth)/resetPass/newPassword");
          },
        },
      ]);
    } else {
      // Xử lý xác thực OTP thất bại
      Alert.alert("Lỗi", "Mã xác thực không hợp lệ. Vui lòng thử lại!");
    }
  };

  const handleInputChange = (text: string, index: number) => {
    const newOtp = [...otp];

    if (text === "") {
      // Nếu xóa ký tự, di chuyển con trỏ về ô trước
      newOtp[index] = ""; // Xóa ký tự tại vị trí hiện tại
      setOtp(newOtp);

      if (index > 0) {
        const prevInput = `otpInput${index - 1}`;
        const prevField = inputs[prevInput];
        if (prevField) {
          prevField.focus();
        }
      }
    } else {
      // Nếu nhập ký tự, cập nhật và chuyển sang ô tiếp theo
      newOtp[index] = text;
      setOtp(newOtp);

      if (index < otp.length - 1) {
        const nextInput = `otpInput${index + 1}`;
        const nextField = inputs[nextInput];
        if (nextField) {
          nextField.focus();
        }
      }
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-500 py-4 px-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-white text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Nhập mã xác thực</Text>
      </View>

      {/* Content */}
      <View className="px-4 py-6">
        <Text className="text-gray-500 mb-4">
          Vui lòng không chia sẻ mã xác thực để tránh mất tài khoản
        </Text>

        {/* Hiển thị số điện thoại */}
        <View className="items-center mb-6">
          <Text className="text-xl font-bold text-black">{phoneNumber}</Text>
          <Text className="text-gray-500 mt-2">
            Soạn tin nhắn nhận mã xác thực và điền vào bên dưới
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs[`otpInput${index}`] = ref)} // Lưu tham chiếu
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleInputChange(text, index)}
            />
          ))}
        </View>

        {/* Hướng dẫn nhận mã */}
        <TouchableOpacity className="mt-4">
          <Text className="text-blue-500 text-center">Hướng dẫn nhận mã</Text>
        </TouchableOpacity>
      </View>

      {/* Xác nhận Button */}
      <TouchableOpacity
        onPress={handleVerify}
        disabled={otp.join("").length !== 6}
        className={`absolute bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center ${
          otp.join("").length === 6 ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        <Text className="text-white text-2xl">→</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
  },
  otpInput: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5, 
    textAlign: "center",
    fontSize: 18,
    color: "#000",
  },
});

export default VerifyResetPass;