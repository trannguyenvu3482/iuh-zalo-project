import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "~/components/Header";

const SLIDER_WIDTH = 50;
const PUZZLE_HEIGHT = 40;
const THRESHOLD = 5;
const TRACK_WIDTH = Dimensions.get("window").width - 80;
const IMAGE_HEIGHT = 200;
const CENTER_Y = IMAGE_HEIGHT / 2 - PUZZLE_HEIGHT / 2;
const MAX_ATTEMPTS = 6;
const CHANGE_IMAGE_AT = 3;

export default function CaptchaScreen() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [position] = useState(new Animated.ValueXY({ x: 0, y: 0 }));
  const imageLeftPosition = position.x.interpolate({
    inputRange: [0, TRACK_WIDTH],
    outputRange: [0, -TRACK_WIDTH],
  });
  const [targetPosition, setTargetPosition] = useState(
    Math.floor(Math.random() * (TRACK_WIDTH - SLIDER_WIDTH * 2) + SLIDER_WIDTH),
  );
  const [imageId, setImageId] = useState(Math.floor(Math.random() * 1000));

  useEffect(() => {
    if (isVerified) {
      // Chuyển đến màn hình OTP và truyền tham số
      router.push({
        pathname: "/(auth)/signup/otp",
      });
    }
  }, [isVerified]);

  useEffect(() => {
    if (attempts === CHANGE_IMAGE_AT) {
      resetCaptcha();
    } else if (attempts === MAX_ATTEMPTS) {
      setIsLocked(true);
      Alert.alert(
        "Quá nhiều lần thử",
        "Vui lòng đợi 1 phút trước khi thử lại",
        [{ text: "Đồng ý" }],
      );
      setTimeout(() => {
        setIsLocked(false);
        setAttempts(0);
        resetCaptcha();
      }, 60000);
    }
  }, [attempts]);

  const resetCaptcha = () => {
    setIsVerified(false);
    setImageId(Math.floor(Math.random() * 1000));
    setTargetPosition(
      Math.floor(
        Math.random() * (TRACK_WIDTH - SLIDER_WIDTH * 2) + SLIDER_WIDTH,
      ),
    );
    position.setValue({ x: 0, y: 0 });
  };

  const handleFailure = () => {
    if (isLocked) return;
    setAttempts((prev) => prev + 1);
    Animated.sequence([
      Animated.sequence([
        Animated.timing(position, {
          toValue: { x: -10, y: 0 },
          duration: 50,
          useNativeDriver: false,
        }),
        Animated.timing(position, {
          toValue: { x: 10, y: 0 },
          duration: 50,
          useNativeDriver: false,
        }),
        Animated.timing(position, {
          toValue: { x: -10, y: 0 },
          duration: 50,
          useNativeDriver: false,
        }),
        Animated.timing(position, {
          toValue: { x: 10, y: 0 },
          duration: 50,
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(position, {
        toValue: { x: 0, y: 0 },
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isLocked,
    onMoveShouldSetPanResponder: () => !isLocked,
    onPanResponderMove: (_, gesture) => {
      if (isLocked) return;
      const newX = Math.max(
        0,
        Math.min(gesture.moveX - SLIDER_WIDTH / 2, TRACK_WIDTH - SLIDER_WIDTH),
      );
      position.setValue({ x: newX, y: 0 });
    },
    onPanResponderRelease: (_, gesture) => {
      if (isLocked) return;
      const finalX = gesture.moveX - SLIDER_WIDTH / 2;

      if (Math.abs(finalX - targetPosition) < THRESHOLD) {
        setIsVerified(true);
        Animated.spring(position, {
          toValue: { x: targetPosition, y: 0 },
          useNativeDriver: false,
        }).start();
      } else {
        handleFailure();
      }
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header title="Xác thực bằng Captcha" showBackButton />

      {/* Content */}
      <View className="flex-1 px-4 py-6">
        <View className="items-center mt-8 mb-8">
          <Text className="text-2xl font-semibold mb-1">
            Xác thực bằng Captcha
          </Text>
          <Text className="text-base">
            Kéo thả mảnh ghép để hoàn tất tấm hình
          </Text>
        </View>

        {/* Image Area */}
        <View className="items-center mb-8">
          <View className="w-full rounded-lg overflow-hidden relative">
            <Image
              source={{
                uri: `https://picsum.photos/seed/${imageId}/400/${IMAGE_HEIGHT}`,
              }}
              style={{ width: "100%", height: IMAGE_HEIGHT }}
              className="rounded-lg"
            />
            {/* Reset Button */}
            <TouchableOpacity
              onPress={resetCaptcha}
              className="absolute top-3 right-3 rounded-full p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="refresh-outline" size={20} color="white" />
            </TouchableOpacity>

            {/* Target Position Marker - Empty Space */}
            <View
              style={{
                position: "absolute",
                left: targetPosition,
                top: CENTER_Y,
                width: SLIDER_WIDTH,
                height: PUZZLE_HEIGHT,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: "rgba(255, 255, 255, 0.8)",
                overflow: "hidden",
              }}
            >
              <Image
                source={{
                  uri: `https://picsum.photos/seed/${imageId}/400/${IMAGE_HEIGHT}`,
                }}
                style={{
                  position: "absolute",
                  width: TRACK_WIDTH + 80,
                  height: IMAGE_HEIGHT,
                  top: -CENTER_Y,
                  left: -targetPosition,
                }}
              />
              <View className="absolute inset-0 bg-black/50" />
            </View>

            {/* Moving Puzzle Piece with Image */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  left: 0,
                  top: CENTER_Y,
                  width: SLIDER_WIDTH,
                  height: PUZZLE_HEIGHT,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: "white",
                  overflow: "hidden",
                  zIndex: 10,
                },
                {
                  transform: [
                    {
                      translateX: position.x.interpolate({
                        inputRange: [0, TRACK_WIDTH],
                        outputRange: [0, TRACK_WIDTH],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Animated.Image
                source={{
                  uri: `https://picsum.photos/seed/${imageId}/400/${IMAGE_HEIGHT}`,
                }}
                style={[
                  {
                    position: "absolute",
                    width: TRACK_WIDTH + 80,
                    height: IMAGE_HEIGHT,
                    top: -CENTER_Y,
                  },
                  {
                    transform: [
                      {
                        translateX: position.x.interpolate({
                          inputRange: [0, TRACK_WIDTH],
                          outputRange: [0, -TRACK_WIDTH],
                        }),
                      },
                    ],
                  },
                ]}
              />
              {isVerified && (
                <View className="absolute inset-0 items-center justify-center bg-green-500/50">
                  <Ionicons name="checkmark" size={20} color="white" />
                </View>
              )}
            </Animated.View>
          </View>
        </View>

        {/* Slider Track */}
        <View className="w-full h-14 bg-gray-100 rounded-full relative mb-4">
          {/* Slider Handle */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              {
                position: "absolute",
                width: SLIDER_WIDTH * 1.5,
                height: "100%",
                backgroundColor: isVerified ? "#22c55e" : "#0066ff",
                borderRadius: 9999,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              },
              position.getLayout(),
            ]}
          >
            <View className="flex-1 items-center justify-center">
              <Ionicons
                name={isVerified ? "checkmark" : "arrow-forward"}
                size={24}
                color="white"
              />
            </View>
          </Animated.View>
        </View>

        {/* Attempts Counter */}
        {attempts > 0 && !isVerified && (
          <Text className="text-red-500 text-center mb-4">
            Thử lại lần {attempts}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
