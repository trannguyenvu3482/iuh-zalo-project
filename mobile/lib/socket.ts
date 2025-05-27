import { io, Socket } from "socket.io-client";

/**
 * Socket service for real-time communication
 * This is a singleton class that manages a single socket connection
 */
export class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private userId: string | null = null;
  private userName: string | null = null;
  private conversationRooms = new Set<string>();
  private directRooms = new Set<string>();
  private isConnected = false;

  private constructor() {
    console.log("[Socket] SocketService initialized");
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(userId: string, userName: string): void {
    if (this.socket && this.isConnected) {
      console.log("[Socket] Already connected, skipping connection");
      return;
    }

    // Store user info for reconnection scenarios
    this.userId = userId;
    this.userName = userName;

    try {
      // Get the backend URL from Constants or use a default
      let SOCKET_URL = "";
      try {
        SOCKET_URL = "http://192.168.0.105:8081";
      } catch (error) {
        console.error(
          "[Socket] Error getting SOCKET_URL from Constants:",
          error,
        );
        SOCKET_URL = "http://192.168.0.105:8081"; // Fallback URL
      }

      console.log(
        `[Socket] Connecting to ${SOCKET_URL} with userId: ${userId}`,
      );

      // Initialize socket connection with auth data
      this.socket = io(SOCKET_URL, {
        query: {
          userId,
          userName,
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      // Set up connection event listeners
      this.socket.on("connect", () => {
        console.log(
          `[Socket] Connected successfully with ID: ${this.socket?.id}`,
        );
        this.isConnected = true;

        // Rejoin all conversation rooms on reconnect
        this.conversationRooms.forEach((conversationId) => {
          console.log(
            `[Socket] Rejoining conversation room: ${conversationId}`,
          );
          this.socket?.emit("join", `conversation_${conversationId}`);
        });

        // Rejoin all direct rooms on reconnect
        this.directRooms.forEach((userId) => {
          console.log(`[Socket] Rejoining direct room: ${userId}`);
          this.socket?.emit("join_direct", { targetUserId: userId });
        });
      });

      this.socket.on("disconnect", () => {
        console.log("[Socket] Disconnected from server");
        this.isConnected = false;
      });

      this.socket.on("connect_error", (error) => {
        console.error("[Socket] Connection error:", error);
        this.isConnected = false;
      });

      this.socket.on("error", (error) => {
        console.error("[Socket] Socket error:", error);
      });

      // Explicitly check if the connection succeeded - useful for debugging
      setTimeout(() => {
        if (!this.isConnected) {
          console.log(
            "[Socket] Connection not established after timeout. Socket state:",
            this.socket?.connected,
          );
        }
      }, 5000);
    } catch (error) {
      console.error("[Socket] Error initializing socket:", error);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.conversationRooms.clear();
      this.directRooms.clear();
      console.log("[Socket] Disconnected and cleaned up");
    }
  }

  public emit(event: string, data: any): boolean {
    if (!this.socket || !this.isConnected) {
      console.log(`[Socket] Cannot emit ${event} - not connected`);
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  public on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.log(`[Socket] Cannot add listener for ${event} - not connected`);
      return;
    }
    this.socket.on(event, (data) => {
      console.log(`[Socket] Received event: ${event}`, data);
      callback(data);
    });
  }

  public off(event: string): void {
    if (!this.socket) return;
    this.socket.off(event);
  }

  public isSocketConnected(): boolean {
    return Boolean(this.isConnected && this.socket?.connected);
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
  public joinConversation(conversationId: string): boolean {
    if (!this.socket || !this.isConnected) {
      console.log("[Socket] Cannot join room - not connected");
      return false;
    }

    try {
      console.log(`[Socket] Joining conversation: ${conversationId}`);

      // Store the conversation ID to rejoin on reconnect
      this.conversationRooms.add(conversationId);

      // Join the conversation room using the correct event name
      this.socket.emit("join", `conversation_${conversationId}`);

      // For private conversations, we should also join a direct room with the receiver
      // This ensures private messages work even without a conversation ID
      console.log(
        `[Socket] Current user ID for direct messaging: ${this.userId}`,
      );

      return true;
    } catch (error) {
      console.error(
        `[Socket] Error joining conversation ${conversationId}:`,
        error,
      );
      return false;
    }
  }

  public sendChatMessage(
    conversationId: string,
    message: string,
    receiverId?: string,
  ): boolean {
    if (!this.socket || !this.isConnected) {
      console.log("[Socket] Cannot send message - not connected");
      return false;
    }

    try {
      // Check if we're in the conversation room already
      if (!this.conversationRooms.has(conversationId)) {
        console.log(
          `[Socket] Not in conversation ${conversationId}, joining now`,
        );
        const joinResult = this.joinConversation(conversationId);
        if (!joinResult) {
          console.log(`[Socket] Failed to join conversation ${conversationId}`);
          return false;
        }
      }

      // Format the message data
      const messageData = {
        conversationId,
        message,
        senderId: this.userId,
        senderName: this.userName,
        receiverId: receiverId || undefined,
        timestamp: new Date().toISOString(),
      };

      console.log(
        `[Socket] Sending message to conversation: ${conversationId}`,
        {
          contentPreview: message.substring(0, 20),
          receiverId: receiverId || "none",
        },
      ); // Send the chat message event
      this.socket.emit("chat message", messageData);

      return true;
    } catch (error) {
      console.error(
        `[Socket] Error sending message to ${conversationId}:`,
        error,
      );
      return false;
    }
  }
}

export const socketService = SocketService.getInstance();
