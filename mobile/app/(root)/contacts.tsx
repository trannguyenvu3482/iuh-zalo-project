import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

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

const allContacts: Contact[] = [
  { id: "1", name: "Anh Cường" },
  { id: "2", name: "Bảo" },
  { id: "3", name: "Cường" },
  { id: "4", name: "Châu" },
  { id: "5", name: "Dũng" },
  { id: "6", name: "An Nhiên" },
  { id: "7", name: "Bình" },
  { id: "8", name: "Đạt" },
  { id: "9", name: "Dương" },
  { id: "10", name: "Cẩm Ly" },
];

const recentContacts: Contact[] = [
  { id: "1", name: "Anh Cường" },
  { id: "6", name: "An Nhiên" },
];

const groups: ContactItemProps[] = [
  {
    id: "g1",
    avatar: "https://i.pravatar.cc/150?img=12",
    name: "SinhVien_Nganh_SE_Khoa 17",
    lastMessage: "Các bạn hãy tham gia thử nhé @All",
    time: "1 giờ",
    unseen: true,
    unseenCount: 12,
    isGroup: true,
  },
  {
    id: "g2",
    avatar: "https://i.pravatar.cc/150?img=12",
    name: "Nhóm lớp",
    lastMessage: "Chúc các em học tốt nhé",
    time: "T4",
    unseen: false,
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

  const tabs = [
    { id: "friends", label: "Bạn bè" },
    { id: "groups", label: "Nhóm" },
    { id: "oa", label: "OA" },
  ];

  const filters = [
    { id: "all", label: "Tất cả 93" },
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
    return selectedFilter === "recent" ? recentContacts : allContacts;
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

  const renderContactItem = (item: Contact) => (
    <TouchableOpacity
      key={item.id}
      className="flex-row items-center px-4 py-3 bg-white"
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
        <Ionicons name="person" size={20} color="#9CA3AF" />
      </View>
      <Text className="flex-1 ml-3 text-gray-900">{item.name}</Text>
    </TouchableOpacity>
  );

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

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row flex-1">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-1 items-center pb-2 ${
                activeTab === tab.id
                  ? "border-b-2 border-primary"
                  : "border-b-2 border-transparent"
              }`}
            >
              <Text
                className={`text-lg font-medium ${
                  activeTab === tab.id ? "font-bold text-black" : "text-gray-500"
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
                    className={`px-4 py-2 rounded-full ${
                      selectedFilter === filter.id
                        ? "bg-gray-200"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <Text
                      className={`${
                        selectedFilter === filter.id
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
                <View className="px-4 py-2 bg-white flex-row justify-between items-center">
                  <Text className="text-sm text-gray-500">Nhóm đang tham gia ({groups.length})</Text>
                  <TouchableOpacity
                    onPress={() => setSortMenuVisible(!isSortMenuVisible)}
                    className="flex-row items-center"
                  >
                    <Text className="text-sm text-primary mr-1">Sắp xếp</Text>
                    <Ionicons name="chevron-down" size={16} color="#007AFF" />
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
                          className={`text-sm ${
                            sortType === option.id ? "text-primary font-medium" : "text-gray-700"
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
                {Object.entries(groupedContacts).map(([letter, contacts]) => (
                  <View key={letter}>
                    <View className="px-4 py-2 bg-gray-50">
                      <Text className="text-sm font-medium text-gray-500">{letter}</Text>
                    </View>
                    {contacts.map(renderContactItem)}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Contacts;
