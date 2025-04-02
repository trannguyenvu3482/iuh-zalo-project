import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import SearchHeader from "../../components/SearchHeader";
import SearchResultsPanel from "../../components/SearchResultsPanel";

const TabLayout = () => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#0286FF",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: "#E2E8F0",
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
          header: () => (
            <SearchHeader
              isSearchActive={isSearchActive}
              setIsSearchActive={setIsSearchActive}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="messages"
          options={{
            title: "Tin nhắn",
            tabBarLabel: ({ focused }) =>
              focused ? (
                <Text className="text-primary text-sm">Tin nhắn</Text>
              ) : null,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "chatbubble" : "chatbubble-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="contacts"
          options={{
            title: "Danh bạ",
            tabBarLabel: ({ focused }) =>
              focused ? (
                <Text className="text-primary text-sm">Danh bạ</Text>
              ) : null,
            tabBarIcon: ({ color, size, focused }) => (
              <AntDesign
                name={focused ? "contacts" : "contacts"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="apps"
          options={{
            title: "Ứng dụng",
            tabBarLabel: ({ focused }) =>
              focused ? (
                <Text className="text-primary text-sm">Ứng dụng</Text>
              ) : null,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "grid" : "grid-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: "Nhật ký",
            tabBarLabel: ({ focused }) =>
              focused ? (
                <Text className="text-primary text-sm">Nhật ký</Text>
              ) : null,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "time" : "time-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Cá nhân",
            tabBarLabel: ({ focused }) =>
              focused ? (
                <Text className="text-primary text-sm">Cá nhân</Text>
              ) : null,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      {isSearchActive && <SearchResultsPanel />}
    </View>
  );
};

export default TabLayout;
