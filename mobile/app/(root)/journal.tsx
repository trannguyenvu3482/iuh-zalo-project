import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Journal = () => {
  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold">Nhật ký</Text>
      </View>
    </SafeAreaView>
  );
};

export default Journal;
