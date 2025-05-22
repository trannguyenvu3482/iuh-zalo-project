import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, useEffect } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View, FlatList } from "react-native";
import { router } from "expo-router";
import { getFriends } from "../../api/apiFriends";
import FriendComponent from "~/components/FriendComponent";
export type ContactSection = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  count?: number;
};

export type Contact = {
  id: string;
  name: string;
  avatar?: string;
};

export type GroupedContacts = {
  [key: string]: Contact[];
};

interface ContactItemProps {
  id: string;
  avatar?: string;
  name: string;
  lastMessage: string;
  time: string;
  unseen?: boolean;
  unseenCount?: number;
  isGroup?: boolean;
  onPress?: () => void;
}

const sections: ContactSection[] = [
  {
    id: "friend-requests",
    icon: "person-add",
    title: "Lời mời kết bạn",
    count: 3,
  },
  {
    id: "phone-contacts",
    icon: "phone-portrait",
    title: "Danh bạ máy",
    subtitle: "Các liên hệ có dùng Zalo",
  },
  {
    id: "birthdays",
    icon: "gift",
    title: "Sinh nhật",
  },
];


const recentContacts: Contact[] = [
  { id: "1", name: "Anh Cường" },
  { id: "6", name: "An Nhiên" },
];

const groups: ContactItemProps[] = [

  {
    id: "g1",
    avatar: "https://i.pravatar.cc/150?img=12",
    name: "DH17KTPMC",
    lastMessage: "Nguyễn Trọng Tiến: Kính gửi thầy cô...",
    time: "1 giờ",
    unseen: true,
    unseenCount: 5,
    isGroup: true,
  },
  {
    id: "g2",
    avatar: "https://i.pravatar.cc/150?img=12",
    name: "Nhóm lớp",
    lastMessage: "Admin: Thông báo về lịch học tuần tới...",
    time: "1 giờ",
    unseen: true,
    unseenCount: 12,
    isGroup: true,
  },
  {
    id: "g3",
    avatar: "https://i.pravatar.cc/150?img=12",
    name: "Nhóm dự án",
    lastMessage: "Minh: Tôi đã cập nhật lại file thiết kế...",
    time: "T4",
    unseen: true,
    unseenCount: 3,
  },
];

const oas: Contact[] = [
  { id: "oa1", name: "Zalo Official" },
  { id: "oa2", name: "Tech News" },
];

const Contacts = () => {
  const [activeTab, setActiveTab] = useState("friends");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortType, setSortType] = useState("lastActivity"); // State cho sắp xếp
  const [isSortMenuVisible, setSortMenuVisible] = useState(false); // Hiển thị menu sắp xếp
  const [friends, setFriends] = useState<Contact[]>([]); // Danh sách bạn bè
  const [isLoading, setIsLoading] = useState(false); // Trạng thái loading
  const [error, setError] = useState<string | null>(null); // Trạng thái // Chuyển thành state

  const tabs = [
    { id: "friends", label: "Bạn bè" },
    { id: "groups", label: "Nhóm" },
    { id: "oa", label: "OA" },
  ];
 useEffect(() => {
  const fetchFriends = async () => {
    try {
      setIsLoading(true);
      const response = await getFriends(); // Gọi API lấy danh sách bạn bè
      console.log("Friends data:", response.data);

      // Map lại dữ liệu cho đúng props của FriendComponent
      const mappedFriends = response.data.map((item: any) => ({
        id: item.id,
        name: item.fullName, // map fullName thành name
        avatar: item.avatar,
      }));

      console.log("Mapped friends data:", mappedFriends);
      setFriends(mappedFriends); // Đúng: setFriends với dữ liệu đã map
      setError(null); // Xóa lỗi nếu có
    } catch (err) {
      console.error("Failed to fetch friends:", err);
      setError("Không thể tải danh sách bạn bè. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  fetchFriends();
}, []);
  const filters = [
    { id: "all", label: "Tất cả " },
    { id: "recent", label: "Mới truy cập" },
  ];

  const sortOptions = [
    { id: "lastActivity", label: "Hoạt động cuối" },
    { id: "name", label: "Tên nhóm" },
    { id: "managed", label: "Nhóm quản lý" },
  ];

  const getContactsByTab = () => {
  if (activeTab === "groups") return groups;
  if (activeTab === "oa") return oas;
  // Nếu filter là "all" hoặc không có recentContacts thì trả về friends
  if (selectedFilter === "recent" && recentContacts.length > 0) return recentContacts;
  return friends;
};
  const filteredContacts = useMemo(() => getContactsByTab(), [activeTab, selectedFilter]);

  const groupedContacts = useMemo(() => {
    const grouped: GroupedContacts = {};
    const sorted = [...filteredContacts].sort((a, b) =>
      a.name.localeCompare(b.name, "vi")
    );
    sorted.forEach((contact) => {
      const letter = contact.name.charAt(0).toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(contact);
    });
    
    return grouped;
  }, [filteredContacts]);

  const sortedGroups = useMemo(() => {
    if (sortType === "name") {
      // Sắp xếp theo tên nhóm (A → Z)
      return [...groups].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }
    if (sortType === "managed") {
      // Sắp xếp theo nhóm quản lý
      const managedGroups = groups.filter((group) => group.isGroup); // Giả định `isGroup` đại diện cho nhóm do tôi quản lý
      const memberGroups = groups.filter((group) => !group.isGroup); // Nhóm tham gia
      return [
        ...managedGroups.sort((a, b) => a.name.localeCompare(b.name, "vi")), // Sắp xếp nhóm quản lý theo tên
        ...memberGroups.sort((a, b) => a.name.localeCompare(b.name, "vi")), // Sắp xếp nhóm tham gia theo tên
      ];
    }
    return groups; // Mặc định không sắp xếp
  }, [groups, sortType]);

  // Gọi API để lấy danh sách bạn bè
 


  const renderGroupItem = (item: ContactItemProps) => (
    <TouchableOpacity
      key={item.id}
      className="flex-row items-center px-4 py-3 bg-white"
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <Image
        source={{ uri: item.avatar }}
        className="w-12 h-12 rounded-full"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-xs text-gray-400 ml-2">{item.time}</Text>
        </View>
        <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      {item.unseen && (
        <View className="ml-2 px-2 py-0.5 bg-red-500 rounded-full items-center justify-center">
          <Text className="text-xs text-white font-medium">
            {item.unseenCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
  const handleSectionPress = (sectionId: string) => {
    switch (sectionId) {
      case "friend-requests":
        router.push("/friend/lists/friend-requests"); // Đường dẫn đến màn hình lời mời kết bạn
        break;
      case "phone-contacts":
        router.push("/friend/lists/phone-contacts"); // Đường dẫn đến màn hình danh bạ máy
        break;
      case "birthdays":
        router.push("/friend/lists/birthdays"); // Đường dẫn đến màn hình sinh nhật
        break;
      default:
        console.warn("Không tìm thấy màn hình phù hợp");
    }
  };
  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row flex-1">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-1 items-center pb-2 ${activeTab === tab.id
                ? "border-b-2 border-primary"
                : "border-b-2 border-transparent"
                }`}
            >
              <Text
                className={`text-lg font-medium ${activeTab === tab.id ? "font-bold text-black" : "text-gray-500"
                  }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1">
        {(activeTab === "friends" || activeTab === "groups" || activeTab === "oa") && (
          <>
            {activeTab === "friends" && (
              <View className="mb-2">
                {sections.map((section) => (
                  <TouchableOpacity
                    key={section.id}
                    className="flex-row items-center px-4 py-3 bg-white"
                    onPress={() => handleSectionPress(section.id)}
                  >
                    <View className="w-8 h-8 rounded-xl bg-primary items-center justify-center">
                      <Ionicons name={section.icon} size={16} color="white" />
                    </View>
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center">
                        <Text className="text-base font-medium text-gray-900">
                          {section.title}
                        </Text>
                        {section.count && (
                          <View className="ml-1 px-1.5">
                            <Text className="text-gray-500">({section.count})</Text>
                          </View>
                        )}
                      </View>
                      {section.subtitle && (
                        <Text className="text-sm text-gray-500">{section.subtitle}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeTab === "friends" && (
              <View className="flex-row px-4 py-2 gap-2">
                {filters.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    onPress={() => setSelectedFilter(filter.id)}
                    className={`px-4 py-2 rounded-full ${selectedFilter === filter.id
                      ? "bg-gray-200"
                      : "bg-white border border-gray-200"
                      }`}
                  >
                    <Text
                      className={`${selectedFilter === filter.id
                        ? "text-gray-900 font-medium"
                        : "text-gray-500"
                        }`}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>

                ))}
              </View>

            )}



            {activeTab === "groups" && (
              <View className="mt-2">
                <View
                  className="flex-row items-center px-4 py-3 bg-white "
                >
                  <TouchableOpacity className="flex-row items-center px-4 py-3 bg-white" onPress={() => router.push("/group/create")}>
                    <Ionicons name="people" size={20} color="#007AFF" />
                    <Text className="ml-2 text-base text-primary font-medium">
                      Tạo nhóm mới
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="px-4 py-2 bg-white flex-row justify-between items-center">
                  <Text className="text-sm text-gray-500">Nhóm đang tham gia ({groups.length})</Text>
                  <TouchableOpacity
                    onPress={() => setSortMenuVisible(!isSortMenuVisible)}
                    className="flex-row items-center"
                  >
                    <Ionicons name="swap-vertical" size={16} color="#9CA3AF" className="mr-1" />
                    {/* Đổi biểu tượng thành `swap-vertical` và thêm màu xám nhạt */}
                    <Text className="text-sm text-gray-500">Sắp xếp</Text>
                  </TouchableOpacity>
                </View>

                {isSortMenuVisible && (
                  <View className="absolute top-16 right-4 bg-white shadow-lg rounded-md z-10">
                    {sortOptions.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        onPress={() => {
                          setSortType(option.id);
                          setSortMenuVisible(false);
                        }}
                        className="px-4 py-2"
                      >
                        <Text
                          className={`text-sm ${sortType === option.id ? "text-primary font-medium" : "text-gray-700"
                            }`}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {sortedGroups.map((group, index) => (
                  <View key={group.id}>
                    {renderGroupItem(group)}
                    {index < sortedGroups.length - 1 && (
                      <View className="h-px bg-gray-200 mx-4" />
                    )}
                  </View>
                ))}
              </View>
            )}

            {activeTab === "friends" && (
              <View className="mt-2">
                {Object.entries(groupedContacts).map(([letter, friends]) => (
                  <View key={letter}>
                    <View className="px-4 py-2 bg-gray-50">
                      <Text className="text-sm font-medium text-gray-500">{letter}</Text>
                    </View>
                    <FlatList
                      data={friends}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <FriendComponent
                          id={item.id}
                          name={item.name}
                          avatar={item.avatar}
                          onPress={() => router.push(`/chat/${item.id}`)} // Điều hướng đến màn hình chat
                        />
                      )}
                      ItemSeparatorComponent={() => <View className="h-px bg-gray-200 mx-4" />}
                    />
                  </View>
                ))}
              </View>
            )}

            {activeTab === "oa" && (
              <View>
                <TouchableOpacity className="flex-row items-center px-4 py-3 bg-white mb-2">
                  {/* Thêm khoảng cách bằng `mb-2` */}
                  <View className="w-10 h-10 rounded-full bg-purple-500 items-center justify-center">
                    <Ionicons name="radio-outline" size={20} color="white" />
                  </View>
                  <Text className="flex-1 ml-3 text-gray-900 font-medium">
                    Tìm thêm Official Account
                  </Text>
                </TouchableOpacity>
                <View className="bg-white">
                  <Text className="px-4 py-2 text-sm text-gray-500 font-medium">
                    Official Account đã quan tâm
                  </Text>
                  {oas.map(renderOAItem)}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View >
  );
};

export default Contacts;
