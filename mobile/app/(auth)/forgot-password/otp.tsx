import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const inputRef = useRef<TextInput>(null);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const phone = useSignupStore((state) => state.data.phoneNumber);

  useEffect(() => {
    if (!phone) return;
    const requestOTP = async () => {
      const unformattedPhone = phone.replace("+84", "0");
      const response = await authAPI.requestPasswordReset(unformattedPhone);
      console.log("response", response);
    };

    requestOTP();

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setIsResendDisabled(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleResend = async () => {
    if (isResendDisabled) return;
    setTimer(60);
    setIsResendDisabled(true);

    if (!phone) return;
    const unformattedPhone = phone.replace("+84", "0");
    const response = await authAPI.requestPasswordReset(unformattedPhone);
    console.log("response", response);
  };

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    setOtp(cleaned);

    if (cleaned.length === OTP_LENGTH) {
      handleVerifyOtp();
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== OTP_LENGTH) return;

    setIsVerifying(true);
    try {
      if (!phone) return;
      const response = await authAPI.verifyPasswordResetOTP(phone, otp);
      console.log("response", response);

      if (response.statusCode === 1) {
        // Store the reset token in the store
        useSignupStore.setState({
          data: {
            ...useSignupStore.getState().data,
            resetToken: response.data.resetToken,
          },
        });
        router.push("/(auth)/forgot-password/reset-password");
      } else {
        alert("Mã OTP không hợp lệ. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Đã xảy ra lỗi khi xác thực OTP. Vui lòng thử lại.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    router.back();
  };

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
              Nhập mã xác thực
            </Text>
            <Text className="text-base text-center">
              <Text className="text-gray-400">Đang gọi đến số</Text> {phone}.{" "}
              <Text className="text-gray-400">
                Nghe máy để nhận mã xác thực gồm 6 chữ số.
              </Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View className="items-center mb-8">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
              className="flex-row justify-center w-full max-w-[260px]"
            >
              {Array(OTP_LENGTH)
                .fill(0)
                .map((_, index) => (
                  <View
                    key={index}
                    className={`w-10 h-12 border-2 rounded-lg items-center justify-center mx-1 ${
                      otp.length === index
                        ? "border-primary"
                        : "border-gray-300"
                    }`}
                  >
                    <Text className="text-2xl font-medium">
                      {otp[index] || ""}
                    </Text>
                  </View>
                ))}
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              className="absolute w-full h-full opacity-0"
              autoFocus
            />
          </View>

          <Button
            title="Tiếp tục"
            className="py-2.5"
            textStyle="text-base"
            disabled={otp.length !== OTP_LENGTH || isVerifying}
            onPress={handleVerifyOtp}
          />

          {/* Timer and Resend */}
          <View className="items-center flex-row justify-center gap-2 mt-4">
            <Text className="text-gray-500">Bạn không nhận được mã?</Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={isResendDisabled}
            >
              <Text
                className={`text-base font-medium ${
                  isResendDisabled ? "text-gray-400" : "text-primary"
                }`}
              >
                Gọi lại {formatTime(timer)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* New Button for SMS or Email */}
          <View className="items-center mt-2">
            <TouchableOpacity
              onPress={() => console.log("Send OTP via SMS or Email")}
              className="flex-row items-center justify-center"
            >
              <Text className="text-base font-medium text-gray-400">
                Bạn vẫn không nhận được mã?{" "}
                <Text className="text-primary">Gửi OTP qua SMS</Text> hoặc{" "}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Button */}
          <View className="absolute bottom-8 left-0 right-0 px-4">
            <TouchableOpacity
              onPress={() => console.log("Need help")}
              className="flex-row items-center justify-center gap-2"
            >
              <Ionicons name="help-circle-outline" size={20} color="#0066ff" />
              <Text className="text-primary text-base">
                Tôi cần hỗ trợ thêm về mã xác thực
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
