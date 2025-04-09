import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

interface QRData {
  type: string;
  sessionId: string;
  instructions: string;
  apiEndpoint: string;
  expiresAt: number;
}

export default function QRScanner() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);
    try {
      // Parse the QR data
      const qrData: QRData = JSON.parse(data);

      // Validate that this is a Zalo QR login code
      if (qrData.type !== "ZALO_QR_LOGIN") {
        Alert.alert(
          "Invalid QR Code",
          "This is not a valid Zalo login QR code.",
        );
        setScanned(false);
        return;
      }

      // Check if the QR code has expired
      if (qrData.expiresAt < Date.now()) {
        Alert.alert(
          "Expired QR Code",
          "This QR code has expired. Please refresh and try again.",
        );
        setScanned(false);
        return;
      }

      // Navigate to QR result page with the scanned data
      router.push({
        pathname: "/qr-result",
        params: { sessionId: qrData.sessionId },
      });
    } catch (error) {
      console.error("Error parsing QR code:", error);
      Alert.alert(
        "Invalid QR Code",
        "Could not read the QR code. Please try again.",
      );
      setScanned(false);
    }
  };

  const handleImagePick = async () => {
    try {
      // Request permission to access media library
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        // TODO: Process the selected image for QR code
        console.log("Selected image:", result.assets[0].uri);
        // You can add QR code detection logic here
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("Error picking image. Please try again.");
    }
  };

  if (hasPermission === null) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white mb-4">No access to camera</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        autofocus="on"
      >
        <View className="flex-1">
          {/* Top Bar */}
          <View className="flex-row items-center justify-between px-4 py-12">
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>

            <View className="flex-row items-center">
              <Ionicons
                name="person-outline"
                size={24}
                color="white"
                className="mr-2"
              />
              <Text className="text-white text-lg font-semibold">
                Mã QR của tôi
              </Text>
            </View>

            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Scanner Area */}
          <View className="flex-1 items-center justify-center mb-32">
            <View className="relative w-80 h-80">
              {/* Top Left Corner */}
              <View className="absolute top-0 left-0 w-16 h-16">
                <View className="absolute top-0 left-0 w-16 h-3 bg-white rounded-full" />
                <View className="absolute top-0 left-0 w-3 h-16 bg-white rounded-full" />
              </View>
              {/* Top Right Corner */}
              <View className="absolute top-0 right-0 w-16 h-16">
                <View className="absolute top-0 right-0 w-16 h-3 bg-white rounded-full" />
                <View className="absolute top-0 right-0 w-3 h-16 bg-white rounded-full" />
              </View>
              {/* Bottom Left Corner */}
              <View className="absolute bottom-0 left-0 w-16 h-16">
                <View className="absolute bottom-0 left-0 w-16 h-3 bg-white rounded-full" />
                <View className="absolute bottom-0 left-0 w-3 h-16 bg-white rounded-full" />
              </View>
              {/* Bottom Right Corner */}
              <View className="absolute bottom-0 right-0 w-16 h-16">
                <View className="absolute bottom-0 right-0 w-16 h-3 bg-white rounded-full" />
                <View className="absolute bottom-0 right-0 w-3 h-16 bg-white rounded-full" />
              </View>
              <Text className="text-white text-2xl font-semibold absolute -top-16 right-[72px]">
                Quét mọi mã QR
              </Text>
            </View>
          </View>

          {/* Bottom Buttons */}
          <View className="absolute bottom-0 left-0 right-0 flex-row justify-center space-x-8 pb-8 gap-36">
            <TouchableOpacity
              className="items-center"
              onPress={handleImagePick}
            >
              <View className="w-12 h-12 bg-white/10 rounded-full items-center justify-center">
                <Ionicons name="image-outline" size={24} color="white" />
              </View>
              <Text className="text-white mt-2">Ảnh có sẵn</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 bg-white/10 rounded-full items-center justify-center">
                <Ionicons name="qr-code-outline" size={24} color="white" />
              </View>
              <Text className="text-white mt-2">Gần đây</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
