import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface NewComponentProps {
  title: string;
  onPress: () => void;
}

const NewComponent: React.FC<NewComponentProps> = ({ title, onPress }) => {
  return (
    <View className="flex items-center justify-center p-4 bg-white rounded-lg shadow-md">
      <Text className="text-lg font-semibold text-gray-800">{title}</Text>
      <TouchableOpacity
        onPress={onPress}
        className="mt-4 px-4 py-2 bg-blue-500 rounded text-white"
      >
        <Text className="text-center">Click Me</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NewComponent;