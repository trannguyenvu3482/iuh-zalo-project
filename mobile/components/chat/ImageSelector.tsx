import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ImageSelectorProps {
  selectedPictures: string[];
  onPictureSelect: (pictureId: string) => void;
  onPictureRemove: (pictureId: string) => void;
  onClose: () => void;
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

export default function ImageSelector({
  selectedPictures,
  onPictureSelect,
  onPictureRemove,
  onClose,
}: ImageSelectorProps) {
  return (
    <View className="bg-white border-t border-gray-200">
      <ScrollView>
        <View style={styles.pictureGrid}>
          {mockPictures.map((picture) => (
            <TouchableOpacity
              key={picture.id}
              onPress={() => onPictureSelect(picture.id)}
              style={styles.pictureItem}
            >
              <Image
                source={{ uri: picture.uri }}
                style={[
                  styles.picture,
                  selectedPictures.includes(picture.id) &&
                    styles.selectedPicture,
                ]}
              />
              {selectedPictures.includes(picture.id) && (
                <View className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full items-center justify-center">
                  <Text className="text-white text-xs">
                    {selectedPictures.indexOf(picture.id) + 1}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pictureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 4,
  },
  pictureItem: {
    width: "33.33%",
    aspectRatio: 1,
    padding: 4,
  },
  picture: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
  selectedPicture: {
    opacity: 0.7,
  },
});
