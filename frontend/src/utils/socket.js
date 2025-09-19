import { io } from "socket.io-client";

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    console.log("Initializing socket connection to:", SOCKET_URL);

    socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
      transports: ["websocket", "polling"],
      path: "/socket.io",
      debug: true,
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server with ID:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      console.error("Error details:", {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type,
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server. Reason:", reason);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Debug events
    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Attempting to reconnect:", attemptNumber);
    });

    socket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("Failed to reconnect");
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("Manually disconnecting socket");
    socket.disconnect();
    socket = null;
  }
};

export default socket;
