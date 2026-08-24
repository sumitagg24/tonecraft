"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  connectSocket,
  emitTyping,
  getRealtimeStatus,
  joinChat,
  joinProject,
  leaveChat,
  leaveProject,
  onRealtimeStatus,
  onSocketEvent,
  type PresenceUpdate,
  type RealtimeStatus,
  type TypingUpdate,
} from "@/lib/socket-client";

const TYPING_TTL_MS = 4000;

interface PresenceEntry {
  userId: string;
  status: string;
  lastSeen: number;
}

type PresenceMap = Record<string, Record<string, PresenceEntry>>;
type TypingMap = Record<string, Record<string, number>>; // chatId -> userId -> expiresAt

function addPresence(map: PresenceMap, key: string, entry: PresenceEntry): PresenceMap {
  const room = map[key] ?? {};
  return { ...map, [key]: { ...room, [entry.userId]: entry } };
}

function removePresence(map: PresenceMap, key: string, userId: string): PresenceMap {
  const room = map[key];
  if (!room?.[userId]) return map;
  const next = { ...room };
  delete next[userId];
  if (Object.keys(next).length === 0) {
    const out = { ...map };
    delete out[key];
    return out;
  }
  return { ...map, [key]: next };
}

function stripUserFromPresence(map: PresenceMap, userId: string): PresenceMap {
  let changed = false;
  const out: PresenceMap = {};
  for (const [key, room] of Object.entries(map)) {
    if (room[userId]) {
      changed = true;
      const next = { ...room };
      delete next[userId];
      if (Object.keys(next).length > 0) out[key] = next;
    } else {
      out[key] = room;
    }
  }
  return changed ? out : map;
}

function stripUserFromTyping(map: TypingMap, userId: string): TypingMap {
  let changed = false;
  const out: TypingMap = {};
  for (const [chatId, users] of Object.entries(map)) {
    if (users[userId]) {
      changed = true;
      const next = { ...users };
      delete next[userId];
      if (Object.keys(next).length > 0) out[chatId] = next;
    } else {
      out[chatId] = users;
    }
  }
  return changed ? out : map;
}

/**
 * Establishes the shared Socket.IO connection and tracks presence + typing
 * state. The connection is a singleton: every consumer (dashboard shell, chat
 * page, composer, notification bell) calls this hook and reuses one socket.
 */
export function useRealtime() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [status, setStatus] = useState<RealtimeStatus>(getRealtimeStatus);
  const [presenceByChat, setPresenceByChat] = useState<PresenceMap>({});
  const [presenceByProject, setPresenceByProject] = useState<PresenceMap>({});
  const [typingByChat, setTypingByChat] = useState<TypingMap>({});

  // Establish the singleton connection once auth is ready. Persistent for the
  // tab session — socket.io reconnects and refreshes the JWT on its own.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    connectSocket(async () => (await getToken()) ?? undefined);
    const offStatus = onRealtimeStatus(setStatus);
    return offStatus;
  }, [isLoaded, isSignedIn, getToken]);

  // Presence + typing events from the rooms this socket has joined.
  useEffect(() => {
    const offPresence = onSocketEvent("presence-update", (data: PresenceUpdate) => {
      const now = Date.now();
      const chatId = data.chatId;
      const projectId = data.projectId;
      if (chatId) {
        if (data.status === "offline") {
          setPresenceByChat((m) => removePresence(m, chatId, data.userId));
        } else {
          setPresenceByChat((m) =>
            addPresence(m, chatId, { userId: data.userId, status: data.status, lastSeen: now })
          );
        }
      } else if (projectId) {
        if (data.status === "offline") {
          setPresenceByProject((m) => removePresence(m, projectId, data.userId));
        } else {
          setPresenceByProject((m) =>
            addPresence(m, projectId, { userId: data.userId, status: data.status, lastSeen: now })
          );
        }
      }
    });

    const offTyping = onSocketEvent("user-typing", (data: TypingUpdate) => {
      setTypingByChat((m) => {
        const users = m[data.chatId] ?? {};
        const next = { ...users };
        if (data.isTyping) next[data.userId] = Date.now() + TYPING_TTL_MS;
        else delete next[data.userId];
        if (Object.keys(next).length === 0) {
          if (!m[data.chatId]) return m;
          const out = { ...m };
          delete out[data.chatId];
          return out;
        }
        return { ...m, [data.chatId]: next };
      });
    });

    const offOffline = onSocketEvent("user-offline", ({ userId }) => {
      setPresenceByChat((m) => stripUserFromPresence(m, userId));
      setPresenceByProject((m) => stripUserFromPresence(m, userId));
      setTypingByChat((m) => stripUserFromTyping(m, userId));
    });

    return () => {
      offPresence();
      offTyping();
      offOffline();
    };
  }, []);

  // Expire typing indicators that outlived their TTL (no typing-stop arrived).
  useEffect(() => {
    const timer = setInterval(() => {
      setTypingByChat((m) => {
        const now = Date.now();
        let changed = false;
        const out: TypingMap = {};
        for (const [chatId, users] of Object.entries(m)) {
          const live: Record<string, number> = {};
          for (const [userId, expiresAt] of Object.entries(users)) {
            if (expiresAt > now) live[userId] = expiresAt;
            else changed = true;
          }
          if (Object.keys(live).length > 0) out[chatId] = live;
          else changed = true;
        }
        return changed ? out : m;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return {
    status,
    presenceByChat,
    presenceByProject,
    typingByChat,
    joinChat,
    leaveChat,
    joinProject,
    leaveProject,
    emitTyping,
  };
}
