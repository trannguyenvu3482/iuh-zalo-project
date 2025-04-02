import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TextInput } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
const Login = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("vi");
  const languages = [
    { label: "Tiếng Việt", value: "vi" },
    { label: "English", value: "en" },
  ];
  return (
    <View style={{ marginTop: 30, width: "100%" }}>
      <View
        style={{
          width: "100%",
          alignItems: "flex-end",
        }}
      >
        <Picker
          selectedValue={selectedLanguage}
          style={{
            height: 20,
            width: 100,
            backgroundColor: "red",
            color: "white",
          }}
          onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
        >
          <Picker.Item label="Vietnamese" value="vi" />
          <Picker.Item label="English" value="en" />
        </Picker>
      </View>
    </View>
  );
};

export default Login;
