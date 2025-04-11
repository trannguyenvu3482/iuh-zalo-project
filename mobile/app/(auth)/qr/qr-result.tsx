import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { scanQR } from "../../../api/apiAuth";
import { useUserStore } from "../../../store/userStore";

export default function QRResult() {
  const router = useRouter();
  const {
    sessionId,
    apiEndpoint,
    deviceInfo: deviceInfoString,
  } = useLocalSearchParams();
  const { user } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [countdown, setCountdown] = useState(5);

  // Parse device info from QR code
  const deviceInfo = deviceInfoString
    ? JSON.parse(deviceInfoString as string)
    : null;

  useEffect(() => {
    // Validate we have session ID and user
    if (!sessionId) {
      Alert.alert("Error", "Missing session information");
      router.back();
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to authorize a QR login");
      router.back();
    }
  }, [sessionId, user]);

  useEffect(() => {
    if (showModal && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showModal, countdown]);

  const handleAccept = async () => {
    if (!user?.id || !sessionId) {
      Alert.alert("Error", "Missing required data for authorization");
      return;
    }

    setLoading(true);
    try {
      // Call the API to approve the QR login
      const response = await scanQR(String(sessionId), user.id);

      Alert.alert("Success", "Login authorized successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error authorizing login:", error);
      Alert.alert("Error", "Failed to authorize login. Please try again.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    Alert.alert("Login Rejected", "You've rejected the login request", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const handleModalAccept = () => {
    if (countdown === 0) {
      setShowModal(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-12">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>
        <View className="flex-row items-center">
          <Ionicons
            name="person-outline"
            size={24}
            color="#1F2937"
            className="mr-2"
          />
          <Text className="text-gray-800 text-lg font-semibold">
            Mã QR của tôi
          </Text>
        </View>
        <View className="w-8" /> {/* Spacer for alignment */}
      </View>

      {/* Warning Message */}
      <View className="px-4 mb-8">
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <View className="flex-row items-start">
            <Ionicons
              name="warning-outline"
              size={24}
              color="#EAB308"
              className="mr-2 mt-1"
            />
            <Text className="text-yellow-800 flex-1">
              Có yêu cầu đăng nhập mới từ thiết bị khác. Vui lòng kiểm tra thông
              tin và xác nhận.
            </Text>
          </View>
        </View>
      </View>

      {/* User Info Container */}
      <View className="flex-1 px-4">
        <View className="bg-white rounded-2xl border border-gray-200 px-6 py-2">
          <View className="space-y-6">
            {/* User Section */}
            <View className="bg-gray-50 rounded-lg p-4">
              <View className="flex-row items-center mb-4">
                <Image
                  source={{
                    uri: user?.avatar,
                  }}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <View>
                  <Text className="text-gray-800 text-lg font-semibold">
                    {user?.fullName || "Unknown User"}
                  </Text>
                </View>
              </View>
              <View className="h-[1px] bg-gray-200 mb-4" />
              {deviceInfo && (
                <>
                  <View className="flex-row items-center">
                    <Ionicons
                      name="desktop-outline"
                      size={20}
                      color="#6B7280"
                      className="mr-3"
                    />
                    <Text className="text-black">{deviceInfo.p}</Text>
                  </View>
                  <View className="flex-row items-center mt-2">
                    <Ionicons
                      name="globe-outline"
                      size={20}
                      color="#6B7280"
                      className="mr-3"
                    />
                    <Text className="text-gray-800">IP: {deviceInfo.i}</Text>
                  </View>
                  <View className="flex-row items-center mt-2">
                    <Ionicons
                      name="earth-outline"
                      size={20}
                      color="#6B7280"
                      className="mr-3"
                    />
                    <Text className="text-gray-800">{deviceInfo.e}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="mt-auto px-4 pb-8 gap-4">
        <TouchableOpacity
          onPress={handleAccept}
          disabled={loading}
          className={`bg-red-500 py-4 rounded-full ${loading ? "opacity-70" : ""}`}
        >
          <Text className="text-white text-center font-semibold">
            {loading ? "Đang xử lý..." : "Chấp nhận"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleReject}
          disabled={loading}
          className="bg-gray-300 py-4 rounded-full"
        >
          <Text className="text-gray-800 text-center font-semibold">
            Từ chối
          </Text>
        </TouchableOpacity>
      </View>

      {/* Warning Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-yellow-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="warning" size={32} color="#EAB308" />
              </View>
              <Text className="text-gray-800 text-2xl font-bold text-center mb-2">
                Cảnh báo bảo mật
              </Text>
              <Text className="text-gray-600 text-center">
                Bạn đang cấp quyền đăng nhập cho một thiết bị mới. Vui lòng xác
                nhận thông tin trước khi tiếp tục.
              </Text>
            </View>

            <View className="gap-3">
              <TouchableOpacity
                onPress={handleModalAccept}
                disabled={countdown > 0}
                className={`py-4 rounded-full ${
                  countdown > 0 ? "bg-gray-300" : "bg-primary"
                }`}
              >
                <Text className="text-white text-center font-semibold">
                  Đồng ý {countdown > 0 && `(${countdown}s)`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-gray-200 py-4 rounded-full"
              >
                <Text className="text-gray-800 text-center font-semibold">
                  Từ chối
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
