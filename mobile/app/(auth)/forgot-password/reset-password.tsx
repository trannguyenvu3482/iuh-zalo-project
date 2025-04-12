import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authAPI } from "~/api";
import { Button } from "~/components/Button";
import { useSignupStore } from "~/store/signupStore";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { resetToken } = useSignupStore((state) => state.data);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
        return "bg-gray-200";
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-blue-500";
      case 4:
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
        return "Rất yếu";
      case 1:
        return "Yếu";
      case 2:
        return "Trung bình";
      case 3:
        return "Mạnh";
      case 4:
        return "Rất mạnh";
      default:
        return "";
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken) {
      alert("Không tìm thấy mã xác thực. Vui lòng thử lại.");
      router.back();
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Mật khẩu không khớp. Vui lòng nhập lại.");
      return;
    }

    const strength = getPasswordStrength(newPassword);
    if (strength < 3) {
      alert("Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.resetPassword(resetToken, newPassword);
      if (response.statusCode === 1) {
        alert("Đặt lại mật khẩu thành công!");
        router.replace("/(auth)/sign-in");
      } else {
        alert("Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    router.back();
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthColor = getPasswordStrengthColor(passwordStrength);
  const strengthText = getPasswordStrengthText(passwordStrength);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Back Button */}
      <TouchableOpacity
        onPress={handleBack}
        className="p-4"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={1}
        onPress={Keyboard.dismiss}
        className="flex-1"
      >
        <View className="flex-1 px-4">
          <View className="items-center mt-4 mb-8">
            <Text className="text-2xl font-semibold mb-1">
              Đặt lại mật khẩu
            </Text>
            <Text className="text-base text-center text-gray-500">
              Vui lòng nhập mật khẩu mới của bạn
            </Text>
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-1">Mật khẩu mới</Text>
            <View className="relative">
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                className="border-2 border-gray-300 rounded-lg p-3 pr-10"
                placeholder="Nhập mật khẩu mới"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Strength Meter */}
          <View className="mb-4">
            <View className="flex-row h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  className={`flex-1 ${
                    i <= passwordStrength ? strengthColor : "bg-gray-200"
                  }`}
                />
              ))}
            </View>
            <Text className="text-sm text-gray-500">{strengthText}</Text>
          </View>

          {/* Confirm Password Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-1">Xác nhận mật khẩu</Text>
            <View className="relative">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                className="border-2 border-gray-300 rounded-lg p-3 pr-10"
                placeholder="Nhập lại mật khẩu mới"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3"
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Đặt lại mật khẩu"
            className="py-2.5"
            textStyle="text-base"
            disabled={isLoading || !newPassword || !confirmPassword}
            onPress={handleResetPassword}
          />

          {/* Password Requirements */}
          <View className="mt-6">
            <Text className="text-sm font-medium mb-2">Yêu cầu mật khẩu:</Text>
            <View className="space-y-1">
              <Text className="text-sm text-gray-500">• Ít nhất 8 ký tự</Text>
              <Text className="text-sm text-gray-500">• Ít nhất 1 chữ hoa</Text>
              <Text className="text-sm text-gray-500">• Ít nhất 1 số</Text>
              <Text className="text-sm text-gray-500">
                • Ít nhất 1 ký tự đặc biệt
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
