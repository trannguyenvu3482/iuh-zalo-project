import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { login } from "~/api/apiAuth";
import Header from "~/components/Header";
import TextInput from "~/components/TextInput";
import { useUserStore } from "~/store/userStore";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useUserStore();

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập số điện thoại và mật khẩu");
      return;
    }

    setLoading(true);
    try {
      console.log("Logging in with:", { phone, password });
      const response = await login(phone, password);
      console.log("Login response received:", response);

      // Check if the response has data field
      const data = response.data || response;

      // Handle successful login
      if (data && data.accessToken && data.user) {
        console.log("Login successful, user:", data.user);
        // Set the user and token in the store
        setUser(data.user);
        setToken(data.accessToken);

        // Navigate to the main screen
        router.replace("/(root)/messages");
      } else if (data && data.statusCode === 0) {
        // API returned an error with statusCode 0
        const errorMessage = data.message || "Đăng nhập thất bại";
        Alert.alert("Lỗi đăng nhập", errorMessage);
      } else {
        // Unexpected response format
        console.warn("Unexpected response format:", data);
        Alert.alert("Lỗi", "Định dạng phản hồi không hợp lệ từ máy chủ");
      }
    } catch (error: any) {
      console.error("Login error details:", error);

      // Detailed error handling for different cases
      let errorMessage = "Đã có lỗi xảy ra khi đăng nhập";

      if (error.message === "Network Error") {
        errorMessage =
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          errorMessage = "Sai số điện thoại hoặc mật khẩu";
        } else if (status === 404) {
          errorMessage = "Không tìm thấy tài khoản với số điện thoại này";
        } else if (data) {
          // Handle different API error responses
          if (data.statusCode === 0) {
            errorMessage = data.message || "Đăng nhập thất bại";
          } else if (data.message) {
            errorMessage = data.message;
          }
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "Máy chủ không phản hồi. Vui lòng thử lại sau.";
      }

      Alert.alert("Đăng nhập thất bại", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = phone.length > 0 && password.length > 0;

  return (
    <SafeAreaView className="flex-1">
      <Header
        title="Đăng nhập"
        showBackButton
        onBackPress={() => router.replace("/")}
      />
      <View className="bg-gray-100 w-full p-4">
        <Text>Vui lòng nhập số điện thoại và mật khẩu để đăng nhập</Text>
      </View>
      <View className="flex-1 items-center px-4 mt-4">
        <View className="w-full gap-4 flex-1">
          <TextInput
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TextInput
            placeholder="Mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity className="items-start">
            <Text className="text-blue-500">Lấy lại mật khẩu</Text>
          </TouchableOpacity>
        </View>

        <View className="w-full flex-row items-center justify-between mt-8 mb-4">
          <TouchableOpacity className="flex-row items-center gap-1">
            <Text className="text-gray-500">Câu hỏi thường gặp</Text>
            <Ionicons name="chevron-forward" size={14} color="#aaa" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={!isFormValid || loading}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              isFormValid && !loading ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="arrow-forward" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;
