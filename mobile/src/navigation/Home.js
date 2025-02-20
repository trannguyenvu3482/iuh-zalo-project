import React from "react";
import { View, Text, StyleSheet, LogBox } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screens/Login/Login";

LogBox.ignoreAllLogs();
const Stack = createNativeStackNavigator();

const Home = ({ navigation }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Home;
