import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getSentFriendRequests, cancelFriendRequest,acceptFriendRequest, getReceivedFriendRequests } from "../../../api/apiFriends"; // Import API function to get sent friend requests
import {useUserStore} from "../../../store/userStore";
interface FriendInfo {
  id: string;
  phoneNumber: string;
  fullName: string;
  avatar: string;
}

interface SentRequestItem {
  userId: string;
  friendId: string;
  status: string;
  created_at: string;
  updated_at: string;
  friend: FriendInfo;
}
interface ReceivedRequestUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  avatar: string;
}

interface ReceivedRequestItem {
  userId: string;
  friendId: string;
  status: string;
  created_at: string;
  updated_at: string;
  user: ReceivedRequestUser;
}
const FriendRequests = () => {
  // State để quản lý tab hiện tại
  const userId = useUserStore((state) => state.user?.id);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [receivedRequest, setReceivedRequest] = useState<ReceivedRequestItem[]>([]);
const [sentRequest, setSentRequest] = useState<SentRequestItem[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Lấy userId từ store


   useEffect(() => {
    const fetchSentRequests = async () => {
      setLoading(true);
      try {
        const res = await getSentFriendRequests();
        setSentRequest(res.data); // Giả sử API trả về danh sách lời mời đã gửi
        console.log("Sent requests:", res.data);
        setError(null);
      } catch (err) {
        setError("Không thể tải danh sách đã gửi");
      } finally {
        setLoading(false);
      }
    };
    fetchSentRequests();
  }, []);

useEffect(() => {
  console.log("userId:", userId);
  if (!userId) return; // Chỉ gọi khi userId đã có giá trị
  const fetchReceivedRequests = async () => {
    setLoading(true);
    try {
      console.log("Fetching received friend requests for userId:", userId);
      const res = await getReceivedFriendRequests(userId);


      setReceivedRequest(res.data);
            console.log("Received requests:", receivedRequest);
      setError(null);
    } catch (err) {
      setError("Không thể tải danh sách đã nhận");
    } finally {
      setLoading(false);
    }
  };
  fetchReceivedRequests();
}, [userId]);

  const handleCancelRequest = async (friendId: string, userId: string) => {
  try {
    await cancelFriendRequest(friendId, userId);
    // Xóa khỏi danh sách đã gửi sau khi hủy thành công
    setSentRequest((prev) => prev.filter((item) => item.friendId !== friendId));
  } catch (error) {
    console.error("Hủy lời mời kết bạn thất bại:", error);
    // Có thể setError hoặc hiển thị thông báo lỗi tại đây
  }
};
  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-blue-500">
        <TouchableOpacity className="mr-4" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Lời mời kết bạn</Text>
        <View className="flex-1" />
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 items-center py-3 ${
            activeTab === "received" ? "border-b-2 border-blue-500" : ""
          }`}
          onPress={() => setActiveTab("received")}
        >
          <Text
            className={`${
              activeTab === "received" ? "text-blue-500" : "text-gray-500"
            } font-medium`}
          >
            Đã nhận {receivedRequest.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 items-center py-3 ${
            activeTab === "sent" ? "border-b-2 border-blue-500" : ""
          }`}
          onPress={() => setActiveTab("sent")}
        >
          <Text
            className={`${
              activeTab === "sent" ? "text-blue-500" : "text-gray-500"
            } font-medium`}
          >
            Đã gửi {sentRequest.length}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nội dung */}
      <ScrollView className="flex-1">
        {activeTab === "received" && (
          <>
            {/* Danh sách "Đã nhận" */}
           {receivedRequest.map((request) => (
  <View
    key={request.userId}
    className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200"
  >
    <Image
      source={{ uri: request.user.avatar }}
      className="w-12 h-12 rounded-full"
    />
    <View className="flex-1 ml-3">
      <Text className="text-base font-medium text-gray-900">
        {request.user.fullName}
      </Text>
      <Text className="text-sm text-gray-500">Muốn kết bạn</Text>
    </View>
    <TouchableOpacity className="px-4 py-2 bg-gray-200 rounded-lg mr-2">
      <Text className="text-gray-800 text-sm font-medium">Từ chối</Text>
    </TouchableOpacity>
    <TouchableOpacity className="px-4 py-2 bg-blue-500 rounded-lg">
      <Text className="text-white text-sm font-medium">Đồng ý</Text>
    </TouchableOpacity>
  </View>
))}
          </>
        )}

        {activeTab === "sent" && (
          <>
            {/* Danh sách "Đã gửi" */}
{sentRequest.map((item) => (
  <View
    key={item.friendId}
    className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200"
  >
    <Image
      source={{ uri: item.friend?.avatar }}
      className="w-12 h-12 rounded-full"
    />
    <View className="flex-1 ml-3">
      <Text className="text-base font-medium text-gray-900">
        {item.friend?.fullName}
      </Text>
      <Text className="text-sm text-gray-500">Đang chờ phản hồi</Text>
    </View>
    <TouchableOpacity className="px-4 py-2 bg-gray-200 rounded-lg" onPress={() => handleCancelRequest(item.friendId, item.userId)}>
      <Text className="text-gray-800 text-sm font-medium">Thu hồi</Text>
    </TouchableOpacity>
  </View>
))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default FriendRequests;