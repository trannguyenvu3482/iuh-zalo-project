export type Reaction = string;

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

export interface User {
  id: string;
  fullName: string;
  avatar: string;
}

export interface FileData {
  uri?: string;
  url?: string;
  name?: string;
  filename?: string;
  size: number;
  type?: string;
  mimeType?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date | string;
  type: "TEXT" | "FILE" | "IMAGE" | "GIF" | "AUDIO" | "VIDEO" | "SYSTEM";
  parentMsgId?: string;
  reactionIds?: string[];
  reactions?: Reaction[];
  reaction?: Reaction; // Single reaction property
  roomId?: string;
  status?: "sent" | "delivered" | "read" | "failed";
  senderAvatar?: string;
  senderName?: string;
  receiverAvatar?: string;
  receiverName?: string;
  created_at?: string;
  updated_at?: string;
  message?: string; // For system messages
  isSystemMessage?: boolean;
  isRecalled?: boolean;
  sender?: User | "me" | string;
  replyTo?: Message;
  replyToId?: string;
  file?: {
    url?: string;
    uri?: string;
    type?: string;
    mimeType?: string;
    name?: string;
    filename?: string;
    size?: number;
  };
  // Additional file properties
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: string;
}

export type VoiceData = {
  uri: string;
  duration: number;
  isPlaying: boolean;
};

export interface ActionButton {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}
