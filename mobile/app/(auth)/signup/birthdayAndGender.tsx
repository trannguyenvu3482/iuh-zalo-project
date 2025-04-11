import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { differenceInYears, format, isAfter } from "date-fns";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useSignupStore } from "~/store/signupStore";

type Gender = "male" | "female" | "";

const BirthdayAndGender: React.FC = () => {
  const [birthday, setBirthday] = useState<string>("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [gender, setGender] = useState<Gender>("");
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { setBirthdate: setBirthdateStore, setGender: setGenderStore } =
    useSignupStore();

  // Check if form is valid
  const isFormValid = birthday.trim() !== "" && gender !== "";

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowDatePicker(false);

    if (event.type === "set" && selectedDate) {
      const today = new Date();

      // Calculate age using date-fns
      const age = differenceInYears(today, selectedDate);

      // Validate that the date is not in the future
      if (isAfter(selectedDate, today)) {
        setShowWarningModal(true);
        return;
      }

      // Check if user is at least 14 years old with proper date-fns functions
      const isOldEnough = age >= 14;

      if (isOldEnough) {
        // Format date using date-fns
        const formattedDate = format(selectedDate, "dd/MM/yyyy");
        setBirthday(formattedDate);
        setBirthDate(selectedDate);
      } else {
        setShowWarningModal(true);
      }
    }
  };

  const handleContinue = () => {
    if (!isFormValid) return;

    setIsLoading(true);
    setShowSuccessModal(true);

    setTimeout(() => {
      setShowSuccessModal(false);
      setIsLoading(false);
      setBirthdateStore(birthDate);
      setGenderStore(gender);
      router.push("/(auth)/signup/createAvatar");
    }, 2000);
  };

  const handleGoBack = () => {
    router.push("/(auth)/signup/createName");
  };

  return (
    <View className="flex-1 bg-white p-6">
      <TouchableOpacity
        className="absolute top-5 left-4 z-10"
        onPress={handleGoBack}
        disabled={isLoading}
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color={isLoading ? "gray" : "black"}
        />
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-center text-black mt-12 mb-6">
        Thêm thông tin cá nhân
      </Text>

      <View className="mt-4 space-y-6">
        <View>
          <TouchableOpacity
            className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3"
            onPress={() => setShowDatePicker(true)}
            disabled={isLoading}
          >
            <TextInput
              placeholder="Sinh nhật (DD/MM/YYYY)"
              value={birthday}
              editable={false}
              className="flex-1 text-black"
            />
            <Ionicons name="calendar-outline" size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={birthDate || new Date()}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        <View className="mt-4">
          <View className="border border-gray-300 rounded-lg px-2">
            <Picker
              selectedValue={gender}
              onValueChange={(itemValue: Gender) => setGender(itemValue)}
              enabled={!isLoading}
            >
              <Picker.Item label="Chọn giới tính" value="" />
              <Picker.Item label="Nam" value="male" />
              <Picker.Item label="Nữ" value="female" />
            </Picker>
          </View>
        </View>
      </View>

      <View className="flex-1 justify-end mb-6">
        <TouchableOpacity
          className={`py-4 rounded-lg items-center ${
            isFormValid ? "bg-blue-500" : "bg-gray-300"
          }`}
          disabled={!isFormValid || isLoading}
          onPress={handleContinue}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Tiếp tục</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Warning Modal */}
      <Modal transparent animationType="fade" visible={showWarningModal}>
        <View className="flex-1 justify-center bg-black/50">
          <View className="bg-white mx-6 rounded-lg p-6 items-center">
            <Ionicons name="warning" size={48} color="orange" />
            <Text className="text-lg font-bold mt-2 mb-4">Cảnh báo</Text>
            <Text className="text-sm text-gray-600 mb-4 text-center">
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

      {/* Success Modal */}
      <Modal transparent animationType="fade" visible={showSuccessModal}>
        <View className="flex-1 justify-center bg-black/50">
          <View className="bg-white mx-6 rounded-lg p-6 items-center">
            <Ionicons name="checkmark-circle" size={48} color="green" />
            <Text className="text-lg font-bold mt-4">
              Tạo tài khoản mới thành công
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BirthdayAndGender;
