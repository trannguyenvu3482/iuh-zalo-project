import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { userAPI } from "~/api";
import { signup } from "~/api/apiAuth";
import { useSignupStore } from "~/store/signupStore";
import { useUserStore } from "~/store/userStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

const CreatePassword = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setPassword: setPasswordStore, getSignupData } = useSignupStore();
  const hasAvatar = useSignupStore((state) => state.data.hasAvatar);
  const { setUser, setToken } = useUserStore();

  // Check if password meets requirements
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword;

  // Update password strength based on criteria
  useEffect(() => {
    let strength = 0;

    if (hasMinLength) strength += 1;
    if (hasLetter) strength += 1;
    if (hasNumber) strength += 1;
    if (hasSpecialChar) strength += 1;

    setPasswordStrength(strength);

    if (password && confirmPassword && !passwordsMatch) {
      setError("Mật khẩu không khớp");
    } else {
      setError("");
    }
  }, [password, confirmPassword]);

  // Check if form is valid for submission
  const isFormValid =
    password.length >= 8 &&
    hasLetter &&
    passwordsMatch &&
    confirmPassword.length > 0;

  const getStrengthLabel = () => {
    if (!password) return "";
    if (passwordStrength <= 1) return "Yếu";
    if (passwordStrength === 2) return "Trung bình";
    if (passwordStrength === 3) return "Khá";
    return "Mạnh";
  };

  const getStrengthColor = () => {
    if (!password) return "bg-gray-200";
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-orange-500";
    if (passwordStrength === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      // 1. Get all signup data except avatar
      const signupData = getSignupData();
      const { avatar, ...userData } = signupData;

      console.log("signupData", signupData);

      // 2. Create user with basic data
      const response = await signup({
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        password,
        gender: userData.gender,
        birthdate: userData.birthdate,
        avatar: !hasAvatar ? avatar : undefined,
      });

      console.log("response sign", response.data);

      const { user, token } = response.data;

      // 3. Upload avatar if exists and not default
      if (hasAvatar) {
        console.log("IS USING SELF AVATAR");

        // Create form data
        const formData = new FormData();
        formData.append("avatar", {
          uri: signupData.avatar,
          type: "image/jpeg",
          name: "avatar.jpg",
        } as any);

        // Upload avatar
        const avatarResponse = await userAPI.updateUserAvatar(formData, token);
        console.log("avatarResponse", avatarResponse);
      }

      // Navigate to main app
      setUser(user);
      setToken(token);
      router.replace("/(root)/messages");
    } catch (error) {
      console.error("Signup error:", error);
      setError("Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <TouchableOpacity className="pt-6 pl-4" onPress={() => router.back()}>
        <Ionicons name="arrow-back-outline" size={24} color="black" />
      </TouchableOpacity>

      <View className="flex-1 px-5 pt-6">
        <Text className="text-xl font-bold mb-4 text-center">
          Tạo mật khẩu mới cho tài khoản của bạn
        </Text>

        {/* Password Input */}
        <View className="mb-6">
          <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
            <TextInput
              className="flex-1 text-xl"
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <View className="mt-2">
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-gray-500">
                  Độ mạnh mật khẩu: {getStrengthLabel()}
                </Text>
              </View>
              <View className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <View
                  className={`h-full ${getStrengthColor()}`}
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                />
              </View>
            </View>
          )}

          {/* Requirements List */}
          <View className="mt-3">
            <View className="">
              <View className="w-1/2 mb-2 flex-row items-center">
                <Ionicons
                  color={hasMinLength ? "green" : "gray"}
                  className="mr-1"
                  name={hasMinLength ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                />
                <Text
                  className={`text-base ${hasMinLength ? "text-green-500" : "text-gray-500"}`}
                >
                  Ít nhất 8 ký tự
                </Text>
              </View>

              <View className="w-1/2 mb-2 flex-row items-center">
                <Ionicons
                  color={hasLetter ? "green" : "gray"}
                  className="mr-1"
                  name={hasLetter ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                />
                <Text
                  className={`text-base ${hasLetter ? "text-green-500" : "text-gray-500"}`}
                >
                  Chứa ít nhất 1 chữ cái
                </Text>
              </View>

              <View className="w-1/2 mb-2 flex-row items-center">
                <Ionicons
                  color={hasNumber ? "green" : "gray"}
                  className="mr-1"
                  name={hasNumber ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                />
                <Text
                  className={`text-base ${hasNumber ? "text-green-500" : "text-gray-500"}`}
                >
                  Chứa ít nhất 1 số
                </Text>
              </View>

              <View className="w-1/2 mb-2 flex-row items-center">
                <Ionicons
                  color={hasSpecialChar ? "green" : "gray"}
                  className="mr-1"
                  name={hasSpecialChar ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                />
                <Text
                  className={`text-base ${hasSpecialChar ? "text-green-500" : "text-gray-500"}`}
                >
                  Chứa ký tự đặc biệt
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View className="mb-6">
          <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
            <TextInput
              className="flex-1 text-xl"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
          </View>
          {error ? (
            <Text className="text-red-500 text-xs mt-1">{error}</Text>
          ) : null}
        </View>

        {/* Continue Button */}
        <View className="mt-6">
          <TouchableOpacity
            className={`py-4 rounded-lg items-center ${
              isFormValid ? "bg-blue-500" : "bg-gray-300"
            }`}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Tiếp tục</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CreatePassword;
