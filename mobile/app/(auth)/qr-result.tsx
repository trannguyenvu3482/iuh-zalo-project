import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

export default function QRResult() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [countdown, setCountdown] = useState(5);

  // Sample data - replace with real data later
  const userData = {
    name: "Đông Nhi",
    phone: "0708119786",
    ip: "192.168.1.100",
    location: "Hồ Chí Minh, Việt Nam",
    device: "iPhone 12 Pro Max",
    avatar:
      "https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/277800c6380fe2ec40459775013b1c9d~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=1618fbe7&x-expires=1743789600&x-signature=8ocZ32EWjEyVM8pQXNHaCSZdgJM%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my", // Sample avatar URL - replace with real avatar
  };

  useEffect(() => {
    if (showModal && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showModal, countdown]);

  const handleAccept = () => {
    // TODO: Handle accept logic
    console.log("Accepting login request");
    router.back();
  };

  const handleReject = () => {
    // TODO: Handle reject logic
    console.log("Rejecting login request");
    router.back();
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
                  source={{ uri: userData.avatar }}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <View>
                  <Text className="text-gray-800 text-lg font-semibold">
                    {userData.name}
                  </Text>
                  <Text className="text-gray-500">{userData.phone}</Text>
                </View>
              </View>
              <View className="h-[1px] bg-gray-200 mb-4" />
              <View className="flex-row items-center">
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color="#6B7280"
                  className="mr-3"
                />
                <Text className="text-black">{userData.device}</Text>
              </View>
            </View>

            {/* IP Address */}
            <View className="bg-gray-50 rounded-lg p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color="#6B7280"
                  className="mr-3"
                />
                <Text className="text-gray-800">IP: {userData.ip}</Text>
              </View>
            </View>

            {/* Location */}
            <View className="bg-gray-50 rounded-lg p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="#6B7280"
                  className="mr-3"
                />
                <Text className="text-gray-800">{userData.location}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="mt-auto px-4 pb-8 gap-4">
        <TouchableOpacity
          onPress={handleAccept}
          className="bg-red-500 py-4 rounded-full"
        >
          <Text className="text-white text-center font-semibold">
            Chấp nhận
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleReject}
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
