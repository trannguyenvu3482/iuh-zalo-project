import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const BirthdayAndGender = () => {
  const [birthday, setBirthday] = useState(""); // Lưu ngày sinh dưới dạng chuỗi
  const [showDatePicker, setShowDatePicker] = useState(false); // Hiển thị Date Picker

  // Hàm xử lý khi chọn ngày
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false); // Ẩn Date Picker
    if (selectedDate) {
      const formattedDate = `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
      setBirthday(formattedDate); // Cập nhật ngày sinh
    }
  };

  return (
    <View className="flex-1 bg-white px-6 py-10">
      {/* Tiêu đề */}
      <Text className="text-xl font-bold text-center text-black">Thêm thông tin cá nhân</Text>

      Trường nhập Sinh nhật
      <View className="mt-8">
        <Text className="text-sm text-gray-500 mb-2">Sinh nhật</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)} // Hiển thị Date Picker khi nhấn
          className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3"
        >
          <TextInput
            placeholder="DD/MM/YYYY"
            value={birthday}
            editable={false} // Không cho phép chỉnh sửa trực tiếp
            className="flex-1 text-black"
          />
          <Ionicons name="calendar-outline" size={20} color="gray" />
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default BirthdayAndGender;