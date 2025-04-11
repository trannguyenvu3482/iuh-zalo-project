import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ImportContacts = () => {
  const handleSelectContacts = () => {
    console.log("Select contacts");
  };

  const handleUpdate = () => {
    console.log("Update");
  };

  const handleSkip = () => {
    console.log("Skip");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center px-4 pt-16 pb-8">
        {/* Tiêu đề */}
        <View className="items-center flex-1">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Kết bạn Zalo dễ dàng từ danh bạ điện thoại
          </Text>
          <Text className="text-base text-gray-500 mb-8 text-center">
            Cho phép Zalo truy cập danh bạ điện thoại để tìm bạn nhanh chóng
          </Text>

          {/* Vòng tròn ảnh đại diện */}
          <View className="items-center justify-center bg-gray-200 rounded-full w-10 h-10 absolute bottom-0 right-0">
            <Ionicons name="camera-outline" size={20} color="gray" />
          </View>
        </View>

        {/* Nút cập nhật */}
        <TouchableOpacity
          onPress={handleUpdate}
          className="w-full bg-primary py-3 rounded-full items-center"
        >
          <Text className="text-white font-bold text-base">Tiếp tục</Text>
        </TouchableOpacity>

        {/* Nút bỏ qua */}
        <TouchableOpacity onPress={handleSkip} className="mt-4 items-center">
          <Text className="font-semibold text-base">Bỏ qua</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ImportContacts;
