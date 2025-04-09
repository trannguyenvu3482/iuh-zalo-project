import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import ReactionPanel from "./ReactionPanel";
import { Message, Reaction, REACTION_ICONS } from "./types";

interface ChatBubbleProps {
  message: Message;
  onReaction: (messageId: string, reaction: Reaction) => void;
  onReply: (message: Message) => void;
}

const ChatBubble = ({ message, onReaction, onReply }: ChatBubbleProps) => {
  const [showReactions, setShowReactions] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [showReplyIcon, setShowReplyIcon] = useState(false);
  const bubbleRef = useRef<View>(null);
  const [bubbleLayout, setBubbleLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Improved pan responder with proper typing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (
        _,
        gestureState: PanResponderGestureState,
      ) => Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dy) < 10,
      onPanResponderGrant: () => {
        // Reset animation to 0 on touch start
        slideAnimation.setValue(0);
      },
      onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
        if (gestureState.dx > 0) {
          // Clamp value to max 80, and add a dampening effect for smoother feel
          const dampened = Math.min(80, gestureState.dx * 0.8);
          slideAnimation.setValue(dampened);

          // Show reply icon when dragged more than 30px
          if (dampened > 30 && !showReplyIcon) {
            setShowReplyIcon(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else if (dampened <= 30 && showReplyIcon) {
            setShowReplyIcon(false);
          }
        }
      },
      onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
        if (gestureState.dx > 40) {
          // Trigger reply if swiped enough
          handleReply();
        }

        // Reset animation with spring physics for smoother return
        Animated.spring(slideAnimation, {
          toValue: 0,
          friction: 8, // More friction for less bouncing
          tension: 60, // Less tension for smoother movement
          useNativeDriver: true,
        }).start();
        setShowReplyIcon(false);
      },
    }),
  ).current;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Measure bubble position for placing reaction panel
    if (bubbleRef.current) {
      bubbleRef.current.measure((x, y, width, height, pageX, pageY) => {
        setBubbleLayout({ x: pageX, y: pageY, width, height });
        setShowReactions(true);
      });
    } else {
      setShowReactions(true);
    }
  };

  const handleReaction = (reaction: Reaction) => {
    onReaction(message.id, reaction);
    setShowReactions(false);
  };

  const handleAction = (action: string) => {
    if (action === "reply") {
      handleReply();
    }
    // Handle other actions...
  };

  const handleReply = () => {
    onReply(message);
  };

  const handleQuickReaction = () => {
    // Quick heart reaction if no reaction exists, otherwise remove reaction
    if (!message.reaction) {
      onReaction(message.id, "heart");
    } else {
      onReaction(message.id, "");
    }
  };

  // System message
  if (message.type === "system") {
    return (
      <View className="bg-gray-100 px-4 py-1 rounded-full self-center my-2">
        <Text className="text-sm text-gray-500">{message.content}</Text>
      </View>
    );
  }

  const isSender = message.sender === "me";

  return (
    <View className={`w-full flex ${isSender ? "items-end" : "items-start"}`}>
      <Animated.View
        ref={bubbleRef}
        onLayout={() => {
          if (bubbleRef.current && bubbleLayout.width === 0) {
            bubbleRef.current.measure((x, y, width, height, pageX, pageY) => {
              setBubbleLayout({ x: pageX, y: pageY, width, height });
            });
          }
        }}
        style={{
          transform: [{ translateX: slideAnimation }],
          maxWidth: "80%",
        }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onLongPress={handleLongPress}
          onPress={handleQuickReaction}
          delayLongPress={200}
          activeOpacity={0.8}
          className="relative mb-1"
        >
          <View
            className={`rounded-2xl px-3 py-2 ${
              isSender
                ? "bg-blue-500 rounded-tr-none"
                : "bg-white border border-gray-200 rounded-tl-none"
            }`}
          >
            <Text className={isSender ? "text-white" : "text-gray-800"}>
              {message.content}
            </Text>
            <Text
              className={`text-xs mt-1 text-right ${
                isSender ? "text-white/60" : "text-gray-500"
              }`}
            >
              {message.timestamp}
            </Text>
          </View>

          {/* Reaction */}
          {message.reaction && (message.reaction as string) !== "" && (
            <View
              className={`absolute -bottom-3 ${
                isSender ? "right-2" : "left-2"
              }`}
            >
              <View className="bg-white rounded-full shadow-sm p-1 border border-gray-100">
                {REACTION_ICONS[
                  message.reaction as keyof typeof REACTION_ICONS
                ] && (
                  <Ionicons
                    name={
                      REACTION_ICONS[
                        message.reaction as keyof typeof REACTION_ICONS
                      ].name as any
                    }
                    size={16}
                    color={
                      REACTION_ICONS[
                        message.reaction as keyof typeof REACTION_ICONS
                      ].color
                    }
                  />
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Reply Icon */}
        {showReplyIcon && (
          <View
            className="absolute left-0 h-full justify-center"
            style={{ left: -40 }}
          >
            <View className="bg-gray-100 rounded-full p-2">
              <Ionicons name="arrow-undo" size={16} color="#666" />
            </View>
          </View>
        )}
      </Animated.View>

      {/* Reaction Panel */}
      <Modal
        visible={showReactions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowReactions(false)}>
          <View className="flex-1 bg-black/20">
            <View
              style={{
                position: "absolute",
                top: bubbleLayout.y + bubbleLayout.height + 5,
                left: isSender ? undefined : bubbleLayout.x,
                right: isSender ? 20 : undefined,
              }}
            >
              <ReactionPanel onSelectReaction={handleReaction} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default ChatBubble;
