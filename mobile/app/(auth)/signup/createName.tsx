import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter, router, useLocalSearchParams } from "expo-router";

const CreateName = () => {
  const router = useRouter();
  const { phone = "Không xác định", countryCode = "+84" } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(false);

  const validateName = (text: string) => {
    // Regex: Tên phải từ 2-40 ký tự, không chứa số, không ký tự đặc biệt, có ít nhất 2 chữ
    const isValidName = text.length >= 2 &&
                        text.length <= 40 &&
                        /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểễệỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]+(\s[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểễệỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]+)+$/.test(text);
  
    // Viết hoa chữ cái đầu của mỗi từ, giữ nguyên khoảng trắng
    const capitalizeName = text
      .split(/\s+/) // Tách các từ bằng khoảng trắng (bao gồm cả khoảng trắng thừa)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" "); // Ghép lại với khoảng trắng
  
    setIsValid(isValidName);
    setName(capitalizeName);
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
      <Text className="text-xl font-bold text-center text-black">Nhập tên Zalo</Text>
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
        <Text>
          • Dài từ 2 đến 40 ký tự
        </Text>
        <Text>
          • Không chứa số
        </Text>
        <Text className="">
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