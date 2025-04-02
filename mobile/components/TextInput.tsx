import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TextInputProps extends React.ComponentProps<typeof RNTextInput> {
  error?: string;
  containerClassName?: string;
}

const TextInput = ({
  error,
  containerClassName,
  secureTextEntry,
  value,
  onChangeText,
  ...props
}: TextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`w-full ${containerClassName}`}>
      <View
        className={`flex-row items-center ${
          isFocused ? "border-blue-500" : "border-gray-300"
        } ${error ? "border-red-500" : ""}`}
        style={[
          {
            flexDirection: "row",
          },
        ]}
      >
        <RNTextInput
          className="flex-1 py-3 text-base bg-gray-100 text-black w-full"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !showPassword}
          {...props}
        />
        {value && value.length > 0 && !secureTextEntry && (
          <TouchableOpacity onPress={() => onChangeText?.("")} className="p-2">
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="p-2"
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-red-500 text-sm">{error}</Text>}
    </View>
  );
};

export default TextInput;
