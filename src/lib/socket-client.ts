"use client";

import { io, type Socket } from "socket.io-client";

/**
 * Client-side singleton for the Socket.IO server mounted at /api/socket
 * (src/app/api/socket/route.ts).
 *
 * The server verifies the Clerk session JWT on every handshake and joins each
 * connection to its personal `user:<id>` room — so `notification` broadcasts
 * from NotificationService reach this socket with no extra wiring. Chat and
 * project rooms are joined on demand via joinChat/joinProject, which is what
 * powers the presence and typing indicators.
 *
 * The connection is intentionally persistent: it is created on first use and
 * lives for the whole tab session (socket.io reconnects automatically, with
 * the Clerk token refreshed on each reconnect attempt — an expired JWT is the
 * usual reason a handshake fails). Subscribers registered via onSocketEvent
 * before the socket exists still receive events: the registry is independent
 * of connection timing.
 */

export type RealtimeStatus = "idle" | "connecting" | "connected" | "disconnected";

export interface PresenceUpdate {
  userId: string;
  chatId?: string | null;
  projectId?: string | null;
  status: string;
}

export interface TypingUpdate {
  userId: string;
  chatId: string;
  isTyping: boolean;
}

export interface RealtimeNotification {
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  workspaceId?: string | null;
  timestamp: string;
}

export interface RealtimeEvents {
  "presence-update": (data: PresenceUpdate) => void;
  "user-typing": (data: TypingUpdate) => void;
  "user-offline": (data: { userId: string }) => void;
  notification: (data: RealtimeNotification) => void;
  "workspace-notification": (data: RealtimeNotification & { userId: string }) => void;
  error: (data: { message: string }) => void;
}

type AnyHandler = (data: unknown) => void;

let socket: Socket | null = null;
let tokenGetter: (() => Promise<string | null | undefined>) | null = null;
// Assigned via setStatus; read by getRealtimeStatus. Kept internal-only so
// ESLint's unused-vars check treats it as write-only (see getRealtimeStatus).
let _status: RealtimeStatus = "idle";

const listeners = new Map<string, Set<AnyHandler>>();
const statusListeners = new Set<(s: RealtimeStatus) => void>();

function setStatus(next: RealtimeStatus) {
  _status = next;
  for (const listener of [...statusListeners]) listener(next);
}

/** Refresh the Clerk JWT (it may have expired) and (re)connect if needed. */
async function refreshTokenAndConnect(): Promise<void> {
  if (!socket) return;
  if (tokenGetter) {
    try {
      socket.auth = { token: (await tokenGetter()) ?? null };
    } catch {
      // Token refresh failed — the pending attempt will surface a
      // connect_error and retry with a fresh token.
    }
  }
  if (!socket.connected) socket.connect();
}

function ensureSocket(): Socket {
  if (socket) return socket;
  socket = io({
    path: "/api/socket",
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000,
    timeout: 10000,
  });
  socket.onAny((event, ...args) => {
    const set = listeners.get(event);
    if (set) for (const handler of [...set]) handler(args[0]);
  });
  socket.on("connect", () => setStatus("connected"));
  socket.on("disconnect", () => setStatus("disconnected"));
  socket.on("connect_error", () => {
    setStatus("disconnected");
    // A rejected handshake usually means an expired JWT — refresh and retry.
    void refreshTokenAndConnect();
  });
  setStatus("connecting");
  void refreshTokenAndConnect();
  return socket;
}

/**
 * Establish (or reuse) the connection. Pass the Clerk `getToken` function so
 * the JWT is attached to the handshake and refreshed on every reconnect.
 * Idempotent — safe to call from every consumer.
 */
export function connectSocket(getToken?: () => Promise<string | null | undefined>): void {
  if (getToken) tokenGetter = getToken;
  ensureSocket();
}

/** Close the connection and reset the singleton (tests/dev tooling only). */
export function disconnectSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  tokenGetter = null;
  listeners.clear();
  setStatus("idle");
}

/** Current connection status (useful for initial state without re-renders). */
export function getRealtimeStatus(): RealtimeStatus {
  return _status;
}

/** Subscribe to connection status changes. Returns an unsubscribe function. */
export function onRealtimeStatus(listener: (s: RealtimeStatus) => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

/** Subscribe to a server event. Returns an unsubscribe function. */
export function onSocketEvent<K extends keyof RealtimeEvents>(
  event: K,
  handler: RealtimeEvents[K]
): () => void {
  let set = listeners.get(event);
  if (!set) {
    set = new Set<AnyHandler>();
    listeners.set(event, set);
  }
  const fn = handler as unknown as AnyHandler;
  set.add(fn);
  return () => {
    listeners.get(event)?.delete(fn);
  };
}

function safeEmit(event: string, payload: Record<string, unknown>): void {
  ensureSocket().emit(event, payload);
}

/** Join/leave a chat room. No-ops for optimistic temp chats (no server row yet). */
export function joinChat(chatId: string): void {
  if (!chatId || chatId.startsWith("temp-")) return;
  safeEmit("join-chat", { chatId });
}

export function leaveChat(chatId: string): void {
  if (!chatId || chatId.startsWith("temp-")) return;
  safeEmit("leave-chat", { chatId });
}

export function joinProject(projectId: string): void {
  if (!projectId) return;
  safeEmit("join-project", { projectId });
}

export function leaveProject(projectId: string): void {
  if (!projectId) return;
  safeEmit("leave-project", { projectId });
}

/** Broadcast typing state to the other members of a chat room. */
export function emitTyping(chatId: string, isTyping: boolean): void {
  if (!chatId || chatId.startsWith("temp-")) return;
  safeEmit(isTyping ? "typing-start" : "typing-stop", { chatId });
}
