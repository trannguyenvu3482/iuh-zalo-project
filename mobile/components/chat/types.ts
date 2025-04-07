export type Reaction = "" | "heart" | "like" | "laugh" | "sad" | "angry";

export interface ReactionIconInfo {
  name: string; // This will be cast as any when used with Ionicons
  color: string;
}

export const REACTION_ICONS: Record<Exclude<Reaction, "">, ReactionIconInfo> = {
  heart: { name: "heart", color: "#e74c3c" },
  like: { name: "thumbs-up", color: "#3498db" },
  laugh: { name: "happy", color: "#f1c40f" },
  sad: { name: "sad", color: "#9b59b6" },
  angry: { name: "flame", color: "#e67e22" },
};

export interface Message {
  id: string;
  content: string;
  sender: "me" | "other";
  timestamp: string;
  type: "text" | "system" | "voice";
  reaction: Reaction;
}

export interface VoiceData {
  uri: string;
  duration: number;
  isPlaying: boolean;
  waveform?: number[]; // Will store audio waveform data
}

export interface ActionButton {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}
