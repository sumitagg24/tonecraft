import { io, Socket } from "socket.io-client";
import { useEffect } from "react";

let socket: Socket | null = null;

export const connectSocket = (userId: string) => {
  if (socket) return socket;

  const token = localStorage.getItem("token"); // Assuming token is stored in localStorage
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
    auth: { token, userId },
    transports: ["websocket"],
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const useSocket = () => {
  const socket = getSocket();

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (!socket) return;
    socket.on(event, callback);
    return () => {
      if (socket) socket.off(event, callback);
    };
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      if (callback) socket.off(event, callback);
      else socket.removeAllListeners(event);
    }
  };

  const emit = (event: string, ...args: any[]) => {
    if (socket) socket.emit(event, ...args);
  };

  return { on, off, emit };
};