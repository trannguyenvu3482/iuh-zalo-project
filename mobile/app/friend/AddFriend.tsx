import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useUserStore } from "~/store/userStore"; // Import user store

const AddFriend = () => {
  const { user, setUser, token } = useUserStore(); // Lấy thông tin người dùng từ user store
  const [phoneNumber, setPhoneNumber] = useState(""); // State lưu số điện thoại
  const [isValid, setIsValid] = useState(false); // State kiểm tra tính hợp lệ của số điện thoại
  const [countryCode, setCountryCode] = useState("+84"); // State lưu đầu số quốc gia

  // Hàm kiểm tra số điện thoại hợp lệ
  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{9,15}$/; // Số điện thoại từ 9 đến 15 chữ số
    return phoneRegex.test(phone);
  };

  // Hàm xử lý khi nhập số điện thoại
  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    setIsValid(isValidPhoneNumber(text)); // Cập nhật trạng thái hợp lệ
  };

  // Hàm xử lý khi nhấn nút gửi
  const handleSend = () => {
    if (!isValid) {
      Alert.alert("Lỗi", "Số điện thoại không hợp lệ. Vui lòng nhập lại.");
      return;
    }
    Alert.alert(
      "Thành công",
      `Đã gửi lời mời kết bạn đến số ${countryCode} ${phoneNumber}`,
    );
  };

  // Hàm xóa số điện thoại
  const clearPhoneNumber = () => {
    setPhoneNumber("");
    setIsValid(false);
  };

  // Lấy thông tin người dùng từ store nếu `userId` tồn tại
  useEffect(() => {
    if (userId && !user) {
      // Giả sử bạn đã lưu thông tin người dùng trong store `useUserStore`
      setUser({
        id: userId,
        phoneNumber: "0123456789", // Thay bằng dữ liệu mẫu hoặc dữ liệu đã lưu
        fullName: "Trần Ngọc Phát",
        avatar: "https://via.placeholder.com/150",
        banner: "https://via.placeholder.com/300x100",
        gender: "male",
        birthdate: "1990-01-01",
        roles: ["user"],
      });
    }
  }, [userId, user, setUser]);

  return (
    <ScrollView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity className="mr-4" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold">Thêm bạn</Text>
      </View>

      {/* QR Code Section */}
      <View className="bg-white items-center p-4 mt-4">
        <Image
          source={{ uri: user?.avatar || "https://via.placeholder.com/150" }} // Hiển thị avatar từ store
          className="w-40 h-40 rounded-lg"
        />
        <Text className="text-lg font-bold mt-2">
          {user?.fullName || "Tên người dùng"}
        </Text>
        <Text className="text-gray-500 mt-1">
          Quét mã để thêm bạn Zalo với tôi
        </Text>
      </View>

      {/* Input Section */}
      <View className="bg-white mt-4 px-4 py-3">
        <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-gray-500 mr-2">{countryCode}</Text>
            <Ionicons name="caret-down" size={16} color="gray" />
          </TouchableOpacity>
          <TextInput
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            className="flex-1 text-gray-800"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange} // Cập nhật state khi nhập
          />
          {phoneNumber.length > 0 && (
            <TouchableOpacity onPress={clearPhoneNumber}>
              <Ionicons name="close-circle" size={20} color="gray" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!isValid} // Vô hiệu hóa nút nếu số điện thoại không hợp lệ
          >
            <Ionicons
              name="arrow-forward"
              size={24}
              color={isValid ? "blue" : "gray"} // Đổi màu nút: xanh dương nếu hợp lệ, xám nếu không
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Options Section */}
      <View className="bg-white mt-4">
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-200"
          onPress={() =>
            Alert.alert(
              "Quét mã QR",
              "Chức năng quét mã QR chưa được triển khai.",
            )
          }
        >
          <Ionicons name="qr-code" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Quét mã QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-200"
          onPress={() =>
            Alert.alert(
              "Danh bạ máy",
              "Chức năng danh bạ máy chưa được triển khai.",
            )
          }
        >
          <Ionicons name="person" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Danh bạ máy</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center px-4 py-3">
          <Ionicons name="people" size={20} color="gray" />
          <Text className="ml-4 text-gray-800">Bạn bè có thể quen</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Section */}
      <View className="px-4 py-3">
        <Text className="text-gray-500 text-center">
          Xem lời mời kết bạn đã gửi tại trang Danh bạ Zalo
        </Text>
      </View>
    </ScrollView>
  );
};

export default AddFriend;
