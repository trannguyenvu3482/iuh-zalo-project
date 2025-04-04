import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import EmojiModal from "react-native-emoji-modal";

import ImageSelector from "./ImageSelector";

interface ChatInputProps {
  message: string;
  onMessageChange: (text: string) => void;
  onSend: () => void;
}

// Mock data for pictures
const mockPictures = [
  { id: "1", uri: "https://picsum.photos/300/300?random=1" },
  { id: "2", uri: "https://picsum.photos/300/300?random=2" },
  { id: "3", uri: "https://picsum.photos/300/300?random=3" },
  { id: "4", uri: "https://picsum.photos/300/300?random=4" },
  { id: "5", uri: "https://picsum.photos/300/300?random=5" },
  { id: "6", uri: "https://picsum.photos/300/300?random=6" },
  { id: "7", uri: "https://picsum.photos/300/300?random=7" },
  { id: "8", uri: "https://picsum.photos/300/300?random=8" },
  { id: "9", uri: "https://picsum.photos/300/300?random=9" },
  { id: "10", uri: "https://picsum.photos/300/300?random=10" },
  { id: "11", uri: "https://picsum.photos/300/300?random=11" },
  { id: "12", uri: "https://picsum.photos/300/300?random=12" },
  { id: "13", uri: "https://picsum.photos/300/300?random=13" },
  { id: "14", uri: "https://picsum.photos/300/300?random=14" },
  { id: "15", uri: "https://picsum.photos/300/300?random=15" },
  { id: "16", uri: "https://picsum.photos/300/300?random=16" },
  { id: "17", uri: "https://picsum.photos/300/300?random=17" },
  { id: "18", uri: "https://picsum.photos/300/300?random=18" },
];

export default function ChatInput({
  message,
  onMessageChange,
  onSend,
}: ChatInputProps) {
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [showPictureGrid, setShowPictureGrid] = useState(false);
  const [selectedPictures, setSelectedPictures] = useState<string[]>([]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (showEmojiModal) {
          setShowEmojiModal(false);
          return true;
        }
        if (showPictureGrid) {
          setShowPictureGrid(false);
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [showEmojiModal, showPictureGrid]);

  const handleEmojiSelect = (emoji: string | null) => {
    if (emoji) {
      onMessageChange(message + emoji);
      setShowEmojiModal(false);
    }
  };

  const handlePictureSelect = (pictureId: string) => {
    setSelectedPictures((prev) => {
      if (prev.includes(pictureId)) {
        return prev.filter((id) => id !== pictureId);
      }
      return [...prev, pictureId];
    });
  };

  const handleRemovePicture = (pictureId: string) => {
    setSelectedPictures((prev) => prev.filter((id) => id !== pictureId));
  };

  const hasContent = message.trim().length > 0 || selectedPictures.length > 0;

  return (
    <View style={styles.container}>
      {selectedPictures.length > 0 && (
        <View className="bg-white border-t border-gray-200 px-4 py-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {selectedPictures.slice(0, 5).map((pictureId) => {
              const picture = mockPictures.find((p) => p.id === pictureId);
              if (!picture) return null;
              return (
                <View key={pictureId} className="relative mr-2">
                  <Image
                    source={{ uri: picture.uri }}
                    className="w-12 h-12 rounded-lg"
                  />
                  <TouchableOpacity
                    onPress={() => handleRemovePicture(pictureId)}
                    className="absolute -right-1 -top-[1px] w-4 h-4 bg-gray-800 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={12} color="white" />
                  </TouchableOpacity>
                </View>
              );
            })}
            {selectedPictures.length > 5 && (
              <View className="w-12 h-12 rounded-lg bg-gray-100 items-center justify-center">
                <Text className="text-gray-500 text-sm">
                  +{selectedPictures.length - 5}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      <View className="flex-row items-center px-4 py-2 border-t border-gray-200">
        <TouchableOpacity
          className="mr-4"
          onPress={() => setShowEmojiModal(!showEmojiModal)}
        >
          <Ionicons name="happy-outline" size={24} color="#666" />
        </TouchableOpacity>
        <TextInput
          value={message}
          onChangeText={onMessageChange}
          placeholder="Tin nhắn"
          placeholderTextColor="#666"
          multiline
          className="flex-1 text-base max-h-24"
          textAlignVertical="center"
        />
        {hasContent ? (
          <TouchableOpacity
            onPress={onSend}
            className="bg-primary px-4 py-1 rounded-full ml-4"
          >
            <Text className="text-white font-medium">Gửi</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center gap-5">
            <TouchableOpacity>
              <Ionicons
                name="ellipsis-horizontal-outline"
                size={24}
                color="#666"
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="mic-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPictureGrid(!showPictureGrid)}
            >
              <Ionicons name="image-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showPictureGrid && (
        <ImageSelector
          selectedPictures={selectedPictures}
          onPictureSelect={handlePictureSelect}
          onPictureRemove={handleRemovePicture}
          onClose={() => setShowPictureGrid(false)}
        />
      )}

      {showEmojiModal && (
        <View style={styles.emojiContainer}>
          <EmojiModal
            onEmojiSelected={handleEmojiSelect}
            columns={8}
            emojiSize={32}
            containerStyle={styles.emojiModal}
            localizedCategories={[
              "Biểu cảm",
              "Con người",
              "Động vật và thiên nhiên",
              "Đồ ăn và thức uống",
              "Hoạt động",
              "Di chuyển và phương tiện",
              "Vật thể",
              "Ký tự",
              "Cờ",
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
  },
  emojiContainer: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    zIndex: 1000,
  },
  emojiModal: {
    width: "100%",
    backgroundColor: "white",
  },
});
