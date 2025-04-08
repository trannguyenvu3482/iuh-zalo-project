import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, router} from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "~/components/Button";

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const router = useRouter();
  const { phone = "Không xác định", countryCode = "+84" } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const inputRef = useRef<TextInput>(null);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
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

  const handleResend = () => {
    if (isResendDisabled) return;
    setTimer(60);
    setIsResendDisabled(true);
    // TODO: Implement resend OTP logic
  };

  const formatTime = (seconds: number) => {
    return `${seconds}s`; // Change to format as "59s"
  };

  const handleOtpChange = (text: string) => {
    // Only allow numbers and limit to OTP_LENGTH
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    setOtp(cleaned);

    if (cleaned.length === OTP_LENGTH) {
      // TODO: Implement OTP verification
      console.log("Verify OTP:", cleaned);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== OTP_LENGTH) return;

    setIsVerifying(true); // Bắt đầu xác thực OTP
    try {
      // TODO: Thay thế bằng API xác thực OTP thực tế
      console.log("Verifying OTP:", otp);
      const isValidOtp = otp === "123456"; // Giả lập OTP hợp lệ là "123456"

      if (isValidOtp) {
        console.log("OTP verified successfully");
        router.push("/(auth)/signup/createName"); // Chuyển đến trang createName
      } else {
        alert("Mã OTP không hợp lệ. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Đã xảy ra lỗi khi xác thực OTP. Vui lòng thử lại.");
    } finally {
      setIsVerifying(false); // Kết thúc xác thực OTP
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
              <Text className="text-gray-400">Đang gọi đến số</Text> {countryCode}{phone}.{" "}
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
                <Text className="text-primary">qua Email</Text>
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
