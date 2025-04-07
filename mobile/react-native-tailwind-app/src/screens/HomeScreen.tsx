import React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold mb-4">Welcome to the Home Screen</Text>
      <Button
        title="Go to New Component"
        onPress={() => navigation.navigate('NewComponent')}
      />
    </View>
  );
};

export default HomeScreen;