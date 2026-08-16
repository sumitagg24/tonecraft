import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (_userId: string) => {
  if (socket) return socket;

  // Send the real Clerk session JWT (the `__session` cookie). The server
  // verifies it against Clerk's JWKS and derives the identity from the token
  // — the userId argument is kept for call-site compatibility but is NOT sent
  // to the server, so a client can never claim another user's identity.
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
    auth: { token: getSessionToken() },
    transports: ["websocket"],
  });

  return socket;
};

/**
 * Read the Clerk session token from the `__session` cookie (same-origin,
 * readable by client JS). Clerk rotates this short-lived JWT automatically.
 */
function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith("__session="));
  return match ? decodeURIComponent(match.slice("__session=".length)) : null;
}

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const useSocket = () => {
  const socket = getSocket();

  const on = (event: string, callback: (...args: unknown[]) => void) => {
    if (!socket) return;
    socket.on(event, callback);
    return () => {
      if (socket) socket.off(event, callback);
    };
  };

  const off = (event: string, callback?: (...args: unknown[]) => void) => {
    if (socket) {
      if (callback) socket.off(event, callback);
      else socket.removeAllListeners(event);
    }
  };

  const emit = (event: string, ...args: unknown[]) => {
    if (socket) socket.emit(event, ...args);
  };

  return { on, off, emit };
};