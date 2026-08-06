"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface WSMessage {
  type: string;
  userId?: string;
  data?: any;
}

export function useWorkspaceWebSocket(workspaceId: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { setUserPresence, removeUserPresence, addTypingUser, removeTypingUser, updateSharedDocument } = useWorkspaceStore();

  const connect = useCallback(() => {
    if (ws?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws?workspaceId=${workspaceId}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setConnected(true);
      setReconnectAttempts(0);
      setWs(socket);
    };

    socket.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (e) {
        console.error("Failed to parse WS message:", e);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      setWs(null);
      attemptReconnect();
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [ws, workspaceId]);

  const attemptReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    const attempts = reconnectAttempts + 1;
    setReconnectAttempts(attempts);
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    reconnectTimeoutRef.current = setTimeout(connect, delay);
  }, [reconnectAttempts, connect]);

  const handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case "connected":
        break;
      case "presence":
        if (message.data?.online) {
          setUserPresence(message.userId!, {
            online: true,
            userId: message.userId!,
            name: message.data.name,
            email: message.data.email,
            image: message.data.image,
            role: message.data.role,
          });
        } else {
          removeUserPresence(message.userId!);
        }
        break;
      case "typing":
        if (message.data?.isTyping) {
          addTypingUser(message.userId!);
        } else {
          removeTypingUser(message.userId!);
        }
        break;
      case "project-update":
        updateSharedDocument(message.data.projectId, message.data.content, message.data.version);
        break;
      case "optimistic-update":
        updateSharedDocument(message.data.projectId, message.data.content, message.data.version);
        break;
      case "error":
        console.error("WS error:", message.data?.message);
        break;
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      ws?.close();
    };
  }, [connect]);

  const send = useCallback((message: WSMessage) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }, [ws]);

  return { ws, connected, send };
}

export function usePresence(workspaceId: string, userId: string) {
  const { send } = useWorkspaceWebSocket(workspaceId);
  const { setUserPresence } = useWorkspaceStore();

  useEffect(() => {
    const handleBeforeUnload = () => {
      send({ type: "presence", data: { online: false } });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [send]);

  const updatePresence = useCallback((data: any) => {
    send({ type: "presence", data: { ...data, online: true } });
  }, [send]);

  return { updatePresence };
}

export function useTypingIndicator(workspaceId: string, userId: string) {
  const { send } = useWorkspaceWebSocket(workspaceId);
  const { addTypingUser, removeTypingUser } = useWorkspaceStore();

  const setTyping = useCallback((isTyping: boolean, channelId: string) => {
    send({ type: "typing", data: { isTyping, channelId } });
  }, [send]);

  return { setTyping };
}

export function useLiveProjectUpdates(workspaceId: string) {
  const { send } = useWorkspaceWebSocket(workspaceId);
  const { updateSharedDocument } = useWorkspaceStore();

  const sendUpdate = useCallback((projectId: string, content: string, version: number) => {
    send({ type: "project-update", data: { projectId, content, version } });
  }, [send]);

  const sendOptimisticUpdate = useCallback((projectId: string, content: string, version: number) => {
    send({ type: "optimistic-update", data: { projectId, content, version } });
  }, [send]);

  return { sendUpdate, sendOptimisticUpdate };
}

export function useConflictResolution(workspaceId: string) {
  const { send } = useWorkspaceWebSocket(workspaceId);
  
  const resolveConflict = useCallback((projectId: string, localContent: string, serverContent: string, strategy: "local" | "server" | "merge" = "merge") => {
    let resolvedContent: string;
    if (strategy === "local") resolvedContent = localContent;
    else if (strategy === "server") resolvedContent = serverContent;
    else {
      // Simple merge strategy: append both with separator
      resolvedContent = `${serverContent}\n---\n${localContent}`;
    }
    
    send({ type: "project-update", data: { projectId, content: resolvedContent, version: Date.now() } });
    return resolvedContent;
  }, [send]);

  return { resolveConflict };
}