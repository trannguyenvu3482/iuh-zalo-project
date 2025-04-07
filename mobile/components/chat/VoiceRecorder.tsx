import { Ionicons } from "@expo/vector-icons";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";

interface VoiceRecorderProps {
  onCancel: () => void;
  onFinishRecording: (uri: string, duration: number) => void;
}

const VoiceRecorder = ({ onCancel, onFinishRecording }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Request microphone permissions
  useEffect(() => {
    const getPermissions = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setPermissionGranted(status === "granted");

        if (status === "granted") {
          // Configure audio session for both recording and playback
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            // Set these to ensure loudspeaker playback
            staysActiveInBackground: false,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false, // This is key to use loudspeaker on Android
          });

          // Start recording immediately
          startRecording();
        }
      } catch (error) {
        console.error("Error requesting audio permissions:", error);
      }
    };

    getPermissions();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Make sure recording is stopped when component unmounts
      if (recording) {
        stopRecording(true);
      }
    };
  }, []);

  // Pulse animation for recording indicator
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Start recording
  const startRecording = async () => {
    try {
      // Configure the recording options
      const recordingOptions = {
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
      };

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(recordingOptions);
      await newRecording.startAsync();

      setRecording(newRecording);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Start timer to track recording duration
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording", error);
    }
  };

  // Stop recording
  const stopRecording = async (cancelled = false) => {
    if (!recording) return;

    try {
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Stop recording
      await recording.stopAndUnloadAsync();

      if (cancelled) {
        setRecording(null);
        onCancel();
        return;
      }

      // Get the recording URI
      const uri = recording.getURI();
      if (!uri) {
        throw new Error("Recording URI is null");
      }

      // Pass the URI and duration back to the parent
      onFinishRecording(uri, recordingDuration);

      // Clean up
      setRecording(null);
    } catch (error) {
      console.error("Error stopping recording:", error);
      onCancel();
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle sliding to cancel
  const handlePanResponderMove = (dx: number) => {
    if (dx < 0) {
      // User is sliding left (to cancel)
      slideAnim.setValue(Math.max(-150, dx));
    }
  };

  const handlePanResponderRelease = (dx: number) => {
    if (dx < -100) {
      // User slid far enough to cancel
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        stopRecording(true);
      });
    } else {
      // Reset position
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  if (!permissionGranted) {
    return (
      <View className="bg-gray-100 p-3 border-t border-gray-200">
        <Text className="text-center text-red-500">
          Please grant microphone permission to record audio
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-gray-100 border-t border-gray-200">
      {/* Sliding cancel UI */}
      <View className="flex-row items-center justify-center py-3 px-4">
        <Animated.View
          style={{
            transform: [{ translateX: slideAnim }],
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Recording button and timer */}
          <View className="flex-row items-center">
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
              className="bg-red-500 rounded-full h-10 w-10 items-center justify-center mr-3"
            >
              <Ionicons name="mic" size={20} color="white" />
            </Animated.View>
            <Text className="text-gray-700 font-medium">
              {formatTime(recordingDuration)}
            </Text>
          </View>

          {/* Instructions */}
          <Text className="ml-3 text-gray-500">
            Slide left to cancel • Tap to stop
          </Text>
        </Animated.View>
      </View>

      {/* Controls */}
      <View className="flex-row justify-between px-4 py-2">
        <TouchableOpacity
          onPress={() => stopRecording(true)}
          className="bg-gray-300 rounded-full px-4 py-2"
        >
          <Text className="text-gray-700 font-medium">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => stopRecording(false)}
          className="bg-primary rounded-full px-4 py-2"
        >
          <Text className="text-white font-medium">Stop & Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VoiceRecorder;
