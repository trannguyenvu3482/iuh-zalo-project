import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
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
import { searchUserByPhoneNumber } from "../../api/apiUser";
import {getFriendRequest, getFriends } from "../../api/apiFriends";
const AddFriend = () => {
  const { user, setUser, token } = useUserStore(); // Lấy thông tin người dùng từ user store
  const [phoneNumber, setPhoneNumber] = useState(""); // State lưu số điện thoại
  const [isValid, setIsValid] = useState(false); // State kiểm tra tính hợp lệ của số điện thoại
  const [countryCode, setCountryCode] = useState("+84"); // State lưu đầu số quốc gia
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // State lưu lỗi nếu có
  // Hàm kiểm tra số điện thoại hợp lệ
const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{9}$/; // Số điện thoại từ 9 đến 14 chữ số
  return phoneRegex.test(phone);
};
 useEffect(() => {
  const fetchFriends = async () => {
    try {
      setIsLoading(true);
      const response = await getFriends(); // Gọi API lấy danh sách bạn bè
      console.log("Friends data:", response.data);

      // Map lại dữ liệu cho đúng props của FriendComponent
      const mappedFriends = response.data.map((item: any) => ({
        id: item.id,
        name: item.fullName, // map fullName thành name
        avatar: item.avatar,
        status: item.status || "inactive", // Giả định có trường status, nếu không có thì mặc định là offline
      }));

      console.log("Mapped friends data:", mappedFriends);
      setFriends(mappedFriends); // Đúng: setFriends với dữ liệu đã map
      setError(null); // Xóa lỗi nếu có
    } catch (err) {
      console.error("Failed to fetch friends:", err);
      setError("Không thể tải danh sách bạn bè. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };
  fetchFriends();
}, []);
  
  // Hàm xử lý khi nhập số điện thoại
  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    setIsValid(isValidPhoneNumber(text)); // Cập nhật trạng thái hợp lệ
  };

const sendFriendRQ = async () => {
  if (isValid) {
    try {
      // 1. Tìm user theo số điện thoại
      const phone = "0"+ phoneNumber; // Thêm "0" vào đầu số điện thoại
      setPhoneNumber(phone); // Cập nhật lại state với số điện thoại đã thêm "0"
      console.log("Searching user by phone number:", phone);
      const searchRes = await searchUserByPhoneNumber(phone);
      // Lấy đúng id từ response mới
      const foundUser = searchRes?.data?.user;
      console.log("Found user:", foundUser);
      
      const foundUserId = foundUser.id;
      console.log("Found user ID:", foundUserId);
      const isFriend = friends.some(friend => friend.id === foundUserId);
      
      if (!foundUserId) {
        Alert.alert("Không tìm thấy người dùng với số điện thoại này.");
        return;
      }else {
        if (isFriend) {
        Alert.alert("Người này đã là bạn bè của bạn.");
        return;
          }else {
        // Chuyển hướng đến trang profile của người dùng đã tìm thấy
        const data = await getFriendRequest(foundUserId);
        console.log("Friend request sent successfully:", data);
        }
      }
      // 2. Gửi lời mời kết bạn
      
      // Có thể set state báo thành công hoặc hiển thị thông báo trên UI
      clearPhoneNumber();
    } catch (error) {
      console.error("Error sending friend request:", error);
      // Có thể set state báo lỗi hoặc hiển thị thông báo lỗi trên UI
    }
  }
};
const goToFriendProfile = () => {
  router.push(`/(root)/contacts`); // Chuyển hướng đến trang profile của người dùng đã tìm thấy
};
// Hàm xử lý khi nhấn nút gửi
const handleSend = () => {
  if (!isValid) {
    // Có thể set state báo lỗi hoặc hiển thị trên UI
  } else {
    sendFriendRQ();
  // Chuyển qua màn hình friendProfile với id đã tìm
    goToFriendProfile(); // Chuyển hướng đến trang profile của người dùng đã tìm thấy
  }
};

  // Hàm xóa số điện thoại
  const clearPhoneNumber = () => {
    setPhoneNumber("");
    setIsValid(false);
  };
  
  //Hàm chuyển qua trang profile với id đã tìm
  
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
