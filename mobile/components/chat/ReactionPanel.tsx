import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";

import { Reaction, REACTION_ICONS } from "./types";

interface ReactionPanelProps {
  onSelectReaction: (reaction: Reaction) => void;
}

const ReactionPanel = ({ onSelectReaction }: ReactionPanelProps) => {
  return (
    <View className="bg-white rounded-lg shadow-md p-2 flex-row">
      {Object.entries(REACTION_ICONS).map(([key, { name, color }]) => (
        <TouchableOpacity
          key={key}
          onPress={() => onSelectReaction(key as Reaction)}
          className="p-2 m-1"
        >
          <Ionicons name={name} size={24} color={color} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ReactionPanel;
