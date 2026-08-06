"use client";
import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { collaborationService } from "@/services/CollaborationService";
import { useUser } from "@clerk/nextjs";

interface CollaborationContextType {
  connected: boolean;
  reconnectCount: number;
  projectPresences: Map<string, Array<{ userId: string; name: string | null; image: string | null; status: string }>>;
  chatPresences: Map<string, Array<{ userId: string; name: string | null; image: string | null; status: string }>>;
  typingUsers: Map<string, Array<{ userId: string; name: string | null }>>;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  updateCursor: (chatId?: string, projectId?: string, x?: number, y?: number) => void;
  broadcastOperation: (resourceType: string, resourceId: string, operation: Record<string, unknown>, baseVersion: number, version: number) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { socket, connected, reconnectCount, emit, on } = useSocket();
  const [projectPresences, setProjectPresences] = useState<Map<string, Array<{ userId: string; name: string | null; image: string | null; status: string }>>>(new Map());
  const [chatPresences, setChatPresences] = useState<Map<string, Array<{ userId: string; name: string | null; image: string | null; status: string }>>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, Array<{ userId: string; name: string | null }>>>(new Map());

  const joinProject = useCallback((projectId: string) => {
    emit("join-project", { projectId });
  }, [emit]);

  const leaveProject = useCallback((projectId: string) => {
    emit("leave-project", { projectId });
    setProjectPresences((prev) => {
      const next = new Map(prev);
      next.delete(projectId);
      return next;
    });
  }, [emit]);

  const joinChat = useCallback((chatId: string) => {
    emit("join-chat", { chatId });
  }, [emit]);

  const leaveChat = useCallback((chatId: string) => {
    emit("leave-chat", { chatId });
    setChatPresences((prev) => {
      const next = new Map(prev);
      next.delete(chatId);
      return next;
    });
  }, [emit]);

  const startTyping = useCallback((chatId: string) => {
    emit("typing-start", { chatId });
  }, [emit]);

  const stopTyping = useCallback((chatId: string) => {
    emit("typing-stop", { chatId });
  }, [emit]);

  const updateCursor = useCallback((chatId?: string, projectId?: string, x?: number, y?: number) => {
    emit("cursor-move", { chatId, projectId, x: x ?? 0, y: y ?? 0 });
  }, [emit]);

  const broadcastOperation = useCallback((resourceType: string, resourceId: string, operation: Record<string, unknown>, baseVersion: number, version: number) => {
    emit("document-operation", { resourceType, resourceId, operation, baseVersion, version });
  }, [emit]);

  useEffect(() => {
    if (!socket || !user) return;

    const unsub1 = on("presence-update", (data) => {
      setProjectPresences((prev) => {
        const next = new Map(prev);
        const key = data.projectId ?? data.chatId ?? "";
        const current = next.get(key) ?? [];
        const updated = data.status === "offline"
          ? current.filter((p) => p.userId !== data.userId)
          : [...current.filter((p) => p.userId !== data.userId), { userId: data.userId, name: null, image: null, status: data.status }];
        next.set(key, updated);
        return next;
      });
    });

    const unsub2 = on("user-typing", (data) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const current = next.get(data.chatId) ?? [];
        const updated = data.isTyping
          ? [...current.filter((t) => t.userId !== data.userId), { userId: data.userId, name: null }]
          : current.filter((t) => t.userId !== data.userId);
        next.set(data.chatId, updated);
        return next;
      });
    });

    const unsub3 = on("cursor-move", () => {});
    const unsub4 = on("user-offline", (data) => {
      setProjectPresences((prev) => {
        const next = new Map(prev);
        for (const [key, presences] of next) {
          next.set(key, presences.filter((p) => p.userId !== data.userId));
        }
        return next;
      });
      setChatPresences((prev) => {
        const next = new Map(prev);
        for (const [key, presences] of next) {
          next.set(key, presences.filter((p) => p.userId !== data.userId));
        }
        return next;
      });
    });

    return () => {
      unsub1(); unsub2(); unsub3(); unsub4();
    };
  }, [socket, user, on]);

  const value: CollaborationContextType = {
    connected,
    reconnectCount,
    projectPresences,
    chatPresences,
    typingUsers,
    joinProject,
    leaveProject,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    updateCursor,
    broadcastOperation,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const ctx = useContext(CollaborationContext);
  if (!ctx) {
    throw new Error("useCollaboration must be used within CollaborationProvider");
  }
  return ctx;
}