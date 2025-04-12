import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { updateUserAvatar, updateUserProfile } from "~/api/apiUser";
import Header from "~/components/Header";
import type { User } from "~/store/userStore";
import { useUserStore } from "~/store/userStore";

interface ProfileChanges {
  fullName?: string;
  birthdate?: string;
  gender?: "male" | "female";
  avatar?: string;
}

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { user, setUser } = useUserStore();

  // Local state for form fields
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [birthDate, setBirthDate] = useState<Date>(
    user?.birthdate ? new Date(user.birthdate) : new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<"male" | "female">(
    (user?.gender as "male" | "female") || "male",
  );
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (event.type === "set" && date) {
      setBirthDate(date);
    }
  };

  const handleAvatarPress = () => {
    bottomSheetRef.current?.expand();
  };

  const handleChoosePhoto = async () => {
    bottomSheetRef.current?.close();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const changes: ProfileChanges = {};
      let hasChanges = false;

      // Check for changes in each field
      if (fullName !== user?.fullName) {
        changes.fullName = fullName;
        hasChanges = true;
      }

      if (birthDate.toISOString() !== user?.birthdate) {
        changes.birthdate = birthDate.toISOString();
        hasChanges = true;
      }

      if (gender !== user?.gender) {
        changes.gender = gender;
        hasChanges = true;
      }

      // First update profile if there are changes
      if (hasChanges) {
        await updateUserProfile(changes);
      }

      // Then update avatar if there's a new one
      if (newAvatar) {
        const formData = new FormData();
        formData.append("avatar", {
          uri: newAvatar,
          type: "image/jpeg",
          name: "avatar.jpg",
        } as any);

        await updateUserAvatar(formData);
      }

      // If any changes were made, update local user state
      if (hasChanges || newAvatar) {
        const updatedUser: User = {
          ...user!,
          ...changes,
          ...(newAvatar && { avatar: newAvatar }),
        };
        setUser(updatedUser);
      }

      Alert.alert("Thành công", "Cập nhật thông tin thành công");
      router.back();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    [],
  );

  return (
    <GestureHandlerRootView
      className="flex-1 bg-gray-200"
      style={{ paddingBottom: insets.bottom }}
    >
      <Header
        title="Chỉnh sửa thông tin"
        showBackButton
        rightComponent={
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        }
      />

      <View className="px-4 py-6 bg-white h-full">
        <View className="flex-row">
          {/* Avatar */}
          <TouchableOpacity className="relative" onPress={handleAvatarPress}>
            <Image
              source={{
                uri:
                  newAvatar || user?.avatar || "https://picsum.photos/200/200",
              }}
              className="w-20 h-20 rounded-full border border-gray-200"
              resizeMode="cover"
            />
            <View className="absolute top-12 right-0 bg-white rounded-full p-1.5 border border-gray-200">
              <Ionicons name="camera-outline" size={16} color="#000" />
            </View>
          </TouchableOpacity>

          {/* Form Fields */}
          <View className="flex-1 ml-4">
            {/* Name Input */}
            <View className="mb-4">
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Họ và tên"
                className="text-base border-b border-blue-500 pb-1"
              />
              <TouchableOpacity
                className={`absolute right-0 top-2 ${
                  fullName ? "opacity-100" : "opacity-0"
                }`}
                onPress={() => setFullName("")}
              >
                <Ionicons name="close" size={20} color="#bbb" />
              </TouchableOpacity>
            </View>

            {/* Birth Date */}
            <View className="mb-4">
              <TouchableOpacity
                className="flex-row items-center justify-between border-b border-gray-200 py-2"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-base">
                  {birthDate.toLocaleDateString("vi-VN")}
                </Text>
                <Ionicons name="pencil-outline" size={18} color="#000" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  display="calendar"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Gender Selection */}
            <View className="flex-row items-center gap-8">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setGender("male")}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    gender === "male" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {gender === "male" && (
                    <View className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </View>
                <Text className="text-base ml-2">Nam</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setGender("female")}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    gender === "female" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {gender === "female" && (
                    <View className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </View>
                <Text className="text-base ml-2">Nữ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className={`bg-blue-500 rounded-full py-3 mt-8 ${
            isLoading ? "opacity-50" : ""
          }`}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text className="text-white text-base font-medium text-center">
            {isLoading ? "ĐANG LƯU..." : "LƯU"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet for Avatar Options */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["25%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView className="flex-1 p-4">
          {/* <TouchableOpacity
            className="flex-row items-center py-3"
            onPress={handleTakePhoto}
          >
            <Ionicons
              name="camera-outline"
              size={24}
              color="#000"
              className="mr-3"
            />
            <Text className="text-base">Chụp ảnh mới</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            className="flex-row items-center py-3"
            onPress={handleChoosePhoto}
          >
            <Ionicons
              name="image-outline"
              size={24}
              color="#000"
              className="mr-3"
            />
            <Text className="text-base">Chọn ảnh có sẵn</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>

      {/* Camera Modal */}
    </GestureHandlerRootView>
  );
}
