import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { useSignupStore } from "~/store/signupStore";

const VIETNAMESE_NAME_REGEX =
  /^[A-Za-zÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]{2,40}$/;
const CreateName = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(false);
  const { setFullName } = useSignupStore();
  // Hàm kiểm tra tính hợp lệ của tên
  const validateName = (text: string) => {
    // Viết hoa chữ cái đầu của mỗi từ
    const formattedName = text
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    setIsValid(
      formattedName.length >= 2 &&
        formattedName.length <= 40 &&
        VIETNAMESE_NAME_REGEX.test(formattedName),
    );
    setName(formattedName);
  };

  const handleNext = () => {
    if (isValid) {
      setFullName(name);
      router.push("/(auth)/signup/birthdayAndGender");
    }
  };

  return (
    <View className="flex-1 bg-white px-6 py-10">
      {/* Tiêu đề */}
      <Text className="text-2xl font-bold text-center text-black">
        Nhập tên Zalo
      </Text>
      <Text className="text-lg text-center text-gray-500 mt-2">
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
          className={`text-base ${name.length >= 2 ? "text-gray-600" : "text-red-500"}`}
        >
          • Dài từ 2 đến 40 ký tự
        </Text>
        <Text
          className={`text-base ${/^[^\d]+$/.test(name) ? "text-gray-600" : "text-red-500"}`}
        >
          • Không chứa số
        </Text>
        <Text className="text-base text-blue-500">
          • Cần tuân thủ{" "}
          <Text className=" text-blue-500">quy định đặt tên Zalo</Text>
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
