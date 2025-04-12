import { io, Socket } from "socket.io-client";

import { API_URL } from "~/constants/config";

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(API_URL, {
      auth: {
        token,
      },
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("Socket connected");
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.error("Socket is not connected");
      return;
    }
    this.socket.emit(event, data);
  }

  public on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.error("Socket is not initialized");
      return;
    }
    this.socket.on(event, callback);
  }

  public off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) {
      console.error("Socket is not initialized");
      return;
    }
    this.socket.off(event, callback);
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const socketService = SocketService.getInstance();
