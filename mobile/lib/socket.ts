import { io, Socket } from "socket.io-client";

import { useUserStore } from "~/store/userStore";

/**
 * Socket service for real-time communication
 * This is a singleton class that manages a single socket connection
 */
export class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private userId: string | null = null;
  private userName: string | null = null;

  private constructor() {
    console.log("[SocketService] Initialized socket service");
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(userId: string, userName: string): void {
    this.userId = userId;
    this.userName = userName;

    console.log(
      `[SocketService] Connecting socket with userId: ${userId}, name: ${userName}`,
    );

    if (this.socket && this.socket.connected) {
      console.log(
        "[SocketService] Socket already connected, disconnecting first",
      );
      this.socket.disconnect();
    }

    // The apiUrl should be the same as in the API service
    const apiUrl = "http://192.168.1.86:8081";
    console.log(`[SocketService] Connecting to socket at: ${apiUrl}`);

    try {
      const { user } = useUserStore.getState();

      console.log("[SocketContext] user", user);

      this.socket = io(apiUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        transports: ["websocket"],
        query: user
          ? {
              userId: user.id,
              name: user.fullName || "Unknown User",
            }
          : {},
      });

      console.log("[SocketService] Socket instance created:", !!this.socket);

      // Set up connection status listeners for debugging
      this.socket.on("connect", () => {
        console.log(
          `[SocketService] Socket connected with ID: ${this.socket?.id}`,
        );
        console.log(`[SocketService] Connection status: ${this.isConnected()}`);

        // Automatically join user's room
        if (userId) {
          console.log(
            `[SocketService] Automatically joining user room: user_${userId}`,
          );
          this.emit("join", `user_${userId}`);
        }
      });

      this.socket.on("connect_error", (error) => {
        // console.error("[SocketService] Socket connection error:", error.name);
      });

      this.socket.on("disconnect", (reason) => {
        console.log(`[SocketService] Socket disconnected: ${reason}`);
      });

      this.socket.on("reconnect_attempt", (attemptNumber) => {
        console.log(
          `[SocketService] Socket reconnection attempt #${attemptNumber}`,
        );
      });

      this.socket.on("reconnect", (attemptNumber) => {
        console.log(
          `[SocketService] Socket reconnected after ${attemptNumber} attempts`,
        );
      });

      this.socket.connect();
    } catch (error) {
      console.error(
        "[SocketService] Error setting up socket connection:",
        error,
      );
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public emit(event: string, data: any): void {
    if (this.socket) {
      console.log(`[SocketService] Emitting event: ${event}`, data);
      this.socket.emit(event, data);
    } else {
      console.error(
        `[SocketService] Cannot emit event: ${event} - Socket not connected`,
      );
    }
  }

  public on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      console.log(`[SocketService] Setting up listener for event: ${event}`);
      this.socket.on(event, (data) => {
        console.log(`[SocketService] Received event: ${event}`, data);
        callback(data);
      });
    } else {
      console.error(
        `[SocketService] Cannot listen for event: ${event} - Socket not connected`,
      );
    }
  }

  public off(event: string): void {
    if (this.socket) {
      console.log(`[SocketService] Removing listener for event: ${event}`);
      this.socket.off(event);
    }
  }

  public isConnected(): boolean {
    return !!this.socket?.connected;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public joinConversation(conversationId: string): void {
    console.log(`[SocketService] Joining conversation room: ${conversationId}`);
    console.log(
      `[SocketService] Current connection status: ${this.isConnected()}`,
    );

    if (!this.isConnected()) {
      console.warn(
        `[SocketService] Cannot join conversation - Socket not connected`,
      );

      // Attempt to reconnect if possible
      if (this.socket && !this.socket.connected) {
        console.log("[SocketService] Attempting to reconnect socket...");
        this.socket.connect();
      }

      return;
    }

    // First join the specific conversation room
    this.emit("join", `conversation_${conversationId}`);

    // Also join a direct room if it's a direct conversation
    if (this.userId) {
      const directRoomId = `direct_${this.userId}_${conversationId}`;
      console.log(`[SocketService] Joining direct room: ${directRoomId}`);
      this.emit("join", directRoomId);

      // Try the reversed format too to ensure we catch all messages
      const reversedDirectRoomId = `direct_${conversationId}_${this.userId}`;
      console.log(
        `[SocketService] Joining reversed direct room: ${reversedDirectRoomId}`,
      );
      this.emit("join", reversedDirectRoomId);
    }
  }

  public sendChatMessage(data: {
    conversationId: string;
    message: string;
    file?: any;
  }): void {
    console.log(
      `[SocketService] Sending chat message to ${data.conversationId}:`,
      data.message,
    );

    console.log(
      `[SocketService] Current connection status: ${this.isConnected()}`,
    );

    if (!this.isConnected()) {
      console.warn(
        `[SocketService] Cannot send message - Socket not connected`,
      );

      // Attempt to reconnect if possible
      if (this.socket && !this.socket.connected) {
        console.log("[SocketService] Attempting to reconnect socket...");
        this.socket.connect();

        // Wait for reconnection and try to send again
        setTimeout(() => {
          if (this.isConnected()) {
            this.sendChatMessage(data);
          }
        }, 1000);
      }

      return;
    }

    // Format the data to match what the backend expects
    const messageData = {
      ...data,
      senderId: this.userId,
      senderName: this.userName,
      timestamp: new Date().toISOString(),
      type: data.file ? "FILE" : "TEXT",
    };

    console.log(`[SocketService] Formatted message data:`, messageData);

    // Ensure we're in the conversation room before sending
    this.joinConversation(data.conversationId);

    // Send the message using the same event name as the frontend
    this.emit("chat message", messageData);
  }
}

export const socketService = SocketService.getInstance();
