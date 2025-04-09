import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const CreateName = () => {
  const router = useRouter();
  const { phone = "Không xác định", countryCode = "+84" } =
    useLocalSearchParams();
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(false);

  // Hàm kiểm tra tính hợp lệ của tên
  const validateName = (text: string) => {
    const isValidName =
      text.length >= 2 && text.length <= 40 && /^[^\d]+$/.test(text);
    setIsValid(isValidName);
    setName(text);
  };

  const handleNext = () => {
    if (isValid) {
      router.push({
        pathname: "/(auth)/signup/birthdayAndGender",
        params: { name, phone, countryCode }, // Truyền tên vào params
      });
    }
  };

  return (
    <View className="flex-1 bg-white px-6 py-10">
      {/* Tiêu đề */}
      <Text className="text-xl font-bold text-center text-black">
        Nhập tên Zalo
      </Text>
      <Text className="text-sm text-center text-gray-500 mt-2">
        Hãy dùng tên thật để mọi người dễ nhận ra bạn
      </Text>

      {/* Input */}
      <TextInput
        placeholder="Nguyễn Văn A"
        value={name}
        onChangeText={validateName}
        className="border border-gray-300 rounded-lg px-4 py-3 mt-6 text-black"
      />

      {/* Gợi ý */}
      <View className="mt-4">
        <Text
          className={`text-sm ${name.length >= 2 ? "text-gray-600" : "text-red-500"}`}
        >
          • Dài từ 2 đến 40 ký tự
        </Text>
        <Text
          className={`text-sm ${/^[^\d]+$/.test(name) ? "text-gray-600" : "text-red-500"}`}
        >
          • Không chứa số
        </Text>
        <Text className="text-sm text-blue-500">
          • Cần tuân thủ{" "}
          <Text className="underline">quy định đặt tên Zalo</Text>
        </Text>
      </View>

      {/* Nút Tiếp tục */}
      <TouchableOpacity
        disabled={!isValid}
        onPress={handleNext}
        className={`mt-6 py-3 rounded-lg ${
          isValid ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        <Text className="text-center text-white font-bold">Tiếp tục</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateName;
