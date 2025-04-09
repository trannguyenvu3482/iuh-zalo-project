import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MediaButton = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
};

type Story = {
  id: string;
  type?: "create";
  name: string;
  avatar?: string;
  preview?: string;
};

type Post = {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  time: string;
  content: string;
  images?: string[];
};

const mediaButtons: MediaButton[] = [
  {
    id: "photo",
    icon: "camera",
    label: "Ảnh",
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  {
    id: "video",
    icon: "videocam",
    label: "Video",
    color: "#ec4899",
    bgColor: "#fce7f3",
  },
  {
    id: "album",
    icon: "images",
    label: "Album",
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  {
    id: "memories",
    icon: "star",
    label: "Kỷ niệm",
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
];

const stories: Story[] = [
  {
    id: "create",
    type: "create",
    name: "Tạo mới",
    preview: "https://github.com/shadcn.png",
  },
  {
    id: "1",
    name: "Đông Nhi",
    avatar: "https://github.com/shadcn.png",
    preview: "https://picsum.photos/300/400",
  },
  {
    id: "2",
    name: "Ngọc Phát",
    avatar: "https://i.pravatar.cc/150?img=1",
    preview: "https://picsum.photos/300/401",
  },
];

const posts: Post[] = [
  {
    id: "1",
    user: {
      name: "Ngọc Phát",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    time: "Hôm qua lúc 16:58",
    content:
      "- Bán Nhà Bình Thạnh Đường Bùi Đình Tuý, Phường 12, Bình Thạnh. Gần Chợ Bà Chiểu!\n- Giá: 5 tỷ 150 triệu còn TL\n- Diện tích: ( 3.6m x Dài 7.5m) sổ vuông vức.\n- Kết cấu: 1 Trệt, 1 lầu....",
    images: [
      "https://i.pravatar.cc/300?img=3",
      "https://i.pravatar.cc/300?img=4",
    ],
  },
];

const Journal = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Status Input */}
        <View className="flex-row items-center px-4 py-3 bg-white">
          <Image
            source={{ uri: "https://github.com/shadcn.png" }}
            className="w-10 h-10 rounded-full"
          />
          <View className="flex-1 ml-3 py-2 px-4 bg-gray-100 rounded-full">
            <Text className="text-gray-500">Hôm nay bạn thế nào?</Text>
          </View>
        </View>

        {/* Media Buttons */}
        <View className="flex-row justify-between px-6 py-3 bg-white border-t border-gray-100">
          {mediaButtons.map((button) => (
            <TouchableOpacity
              key={button.id}
              className="flex-row items-center px-3 py-2 bg-gray-100 rounded-full"
            >
              <Ionicons name={button.icon} size={18} color={button.color} />
              <Text className="text-sm text-gray-600 ml-1">{button.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gray Gap */}
        <View className="h-3 bg-gray-200" />

        {/* Stories */}
        <View className="bg-white">
          <Text className="px-4 py-2 text-base font-medium">Khoảnh khắc</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 py-2"
          >
            {stories.map((story) => (
              <TouchableOpacity
                key={story.id}
                className="items-center mr-4 w-24"
              >
                {story.type === "create" ? (
                  <>
                    <View className="relative w-24 h-32">
                      <Image
                        source={{ uri: story.preview }}
                        className="w-full h-full rounded-xl"
                      />
                      <View className="absolute inset-0 bg-black/30 rounded-xl items-center justify-end">
                        <View className="w-9 h-9 rounded-full bg-blue-500 items-center justify-center">
                          <Ionicons name="pencil" size={18} color="white" />
                        </View>
                        <Text className="my-2 text-sm text-white font-medium text-center">
                          Tạo mới
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View className="relative w-24 h-32">
                    <Image
                      source={{ uri: story.preview }}
                      className="w-full h-full rounded-xl"
                    />
                    {/* Gradient overlay for better text visibility */}
                    <View className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl" />
                    <View className="absolute bottom-2 left-0 right-0 px-2 items-center">
                      <Image
                        source={{ uri: story.avatar }}
                        className="w-7 h-7 rounded-full border-2 border-blue-500"
                      />
                      <Text
                        className="mt-1 text-sm text-white font-medium"
                        numberOfLines={1}
                      >
                        {story.name}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Gray Gap */}
        <View className="h-3 bg-gray-200" />

        {/* Posts */}
        <View className="mt-2">
          {posts.map((post) => (
            <View key={post.id} className="bg-white mb-2">
              {/* Post Header */}
              <View className="flex-row items-center px-4 py-3">
                <Image
                  source={{ uri: post.user.avatar }}
                  className="w-10 h-10 rounded-full"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-base font-medium">
                    {post.user.name}
                  </Text>
                  <Text className="text-sm text-gray-500">{post.time}</Text>
                </View>
                <TouchableOpacity>
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={24}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              {/* Post Content */}
              <View className="px-4 pb-3">
                <Text className="text-base text-gray-900">{post.content}</Text>
              </View>

              {/* Post Images */}
              {post.images && (
                <View className="flex-row flex-wrap">
                  {post.images.map((image, index) => (
                    <Image
                      key={index}
                      source={{ uri: image }}
                      className="w-1/2 h-48"
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Journal;
