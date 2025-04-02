import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

interface QRCodeButtonProps {
  size?: number;
  color?: string;
  className?: string;
}

const QRCodeButton = ({
  size = 20,
  color = "white",
  className = "",
}: QRCodeButtonProps) => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const handlePress = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        // TODO: Show permission denied message
        return;
      }
    }
    router.push("/(auth)/qr-scanner");
  };

  return (
    <TouchableOpacity
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      className={className}
      onPress={handlePress}
    >
      <MaterialCommunityIcons name="qrcode-scan" size={size} color={color} />
    </TouchableOpacity>
  );
};

export default QRCodeButton;
