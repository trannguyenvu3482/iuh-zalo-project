import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";

const BirthdayAndGender: React.FC = () => {
  const [birthday, setBirthday] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [gender, setGender] = useState<string>("");
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const router = useRouter();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const formattedDate = `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
      const today = new Date();
      const age = today.getFullYear() - selectedDate.getFullYear();
      const isBirthdayPassed =
        today.getMonth() > selectedDate.getMonth() ||
        (today.getMonth() === selectedDate.getMonth() && today.getDate() >= selectedDate.getDate());

      if (age > 14 || (age === 14 && isBirthdayPassed)) {
        setBirthday(formattedDate);
      } else {
        setShowWarningModal(true);
      }
    }
    setShowDatePicker(false);
  };

  return (
    <View className="flex-1 bg-white p-6">
      <TouchableOpacity
        className="absolute top-5 left-4 z-10"
        onPress={() => router.push("/(auth)/signup/createName")}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text className="text-xl font-bold text-center text-black mt-12 mb-6">
        Thêm thông tin cá nhân
      </Text>

      <TouchableOpacity
        className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 mb-4"
        onPress={() => setShowDatePicker(true)}
      >
        <TextInput
          placeholder="Sinh nhật (DD/MM/YYYY)"
          value={birthday}
          editable={false}
          className="flex-1 text-black"
        />
        <Ionicons name="calendar-outline" size={20} color="gray" />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 mb-6">
        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => setGender(itemValue)}
          style={{ flex: 1 }}
        >
          <Picker.Item label="Chọn giới tính" value="" />
          <Picker.Item label="Nam" value="male" />
          <Picker.Item label="Nữ" value="female" />
        </Picker>
      </View>

      {showWarningModal && (
        <Modal transparent={true} animationType="fade" visible={showWarningModal}>
          <View className="flex-1 justify-center bg-black/50">
            <View className="bg-white mx-6 rounded-lg p-6 items-center">
              <Text className="text-lg font-bold mb-4">Cảnh báo</Text>
              <Text className="text-sm text-gray-600 mb-4">
                Bạn cần đủ 14 tuổi để sử dụng Zalo.
              </Text>
              <TouchableOpacity
                className="bg-blue-500 px-6 py-3 rounded-lg"
                onPress={() => setShowWarningModal(false)}
              >
                <Text className="text-white font-bold">Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <TouchableOpacity
        className={`py-3 rounded-lg items-center ${
          birthday && gender ? "bg-blue-500" : "bg-gray-300"
        }`}
        disabled={!birthday || !gender}
      >
        <Text className="text-white font-bold">Tiếp tục</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BirthdayAndGender;