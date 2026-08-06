"use client";
import React, { useEffect, useRef } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useUser } from "@clerk/nextjs";
import { collaborationService } from "@/services/CollaborationService";

interface CollaborationSocketProviderProps {
  children: React.ReactNode;
  projectId?: string;
  chatId?: string;
}

export function CollaborationSocketProvider({ children, projectId, chatId }: CollaborationSocketProviderProps) {
  const { user } = useUser();
  const { connected, emit } = useSocket();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!connected || !user) return;

    if (projectId) {
      emit("join-project", { projectId });
    }
    if (chatId) {
      emit("join-chat", { chatId });
    }

    heartbeatRef.current = setInterval(() => {
      collaborationService.updatePresence({
        userId: user.id,
        projectId,
        chatId,
        status: "active",
      });
    }, 15000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (projectId) emit("leave-project", { projectId });
      if (chatId) emit("leave-chat", { chatId });
    };
  }, [connected, user, projectId, chatId, emit]);

  return <>{children}</>;
}