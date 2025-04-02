import { router } from "expo-router";
import { useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";

import { Button } from "~/components/Button";
import { images } from "~/constants/images";

export default function Home() {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <SafeAreaView className="flex-1 justify-end px-4 items-center py-5">
      <Image
        className="w-[140px] h-auto object-cover mt-8 mb-20"
        source={images.zaloLogo}
        resizeMode="contain"
      />

      <Swiper
        className="flex-1"
        ref={swiperRef}
        loop
        containerStyle={{
          height: "100%",
          marginBottom: 60,
        }}
        dot={
          <View className="w-[8px] h-[8px] mx-1 bg-[#E2E8F0] rounded-full" />
        }
        activeDot={
          <View className="w-[8px] h-[8px] mx-1 bg-[#0286FF] rounded-full" />
        }
        autoplay
        autoplayTimeout={1500}
        autoplayDirection
      >
        <View className="flex-1 items-center justify-center gap-2 pb-4">
          <Image
            className="w-auto h-[60%] object-cover"
            source={images.welcome01}
            resizeMode="contain"
          />
          <View className="items-center px-8 gap-2">
            <Text className="text-blue-500 text-xl font-bold">
              Trải nghiệm xuyên suốt
            </Text>
            <Text className="text-center">
              Kết nối và giải quyết công việc trên mọi thiết bị với dữ liệu luôn
              được đồng bộ
            </Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center gap-2 pb-4">
          <Image
            className="w-auto h-[60%] object-cover"
            source={images.welcome02}
            resizeMode="contain"
          />
          <View className="items-center px-8 gap-2">
            <Text className="text-blue-500 text-xl font-bold">
              Chế độ Dark Mode
            </Text>
            <Text className="text-center">
              Chế độ tối giảm ánh sáng, giúp bạn có trải nghiệm tốt hơn trong
              đêm
            </Text>
          </View>
        </View>
      </Swiper>

      <View className="justify-end gap-5 w-full">
        <Button
          onPress={() => router.push("/(auth)/login")}
          title="Đăng nhập"
          type="primary"
        />
        <Button
          onPress={() => router.push("/(auth)/signup")}
          title="Tạo tài khoản mới"
          type="secondary"
        />
      </View>
    </SafeAreaView>
  );
}
