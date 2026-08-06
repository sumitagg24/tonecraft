"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@clerk/nextjs";

type SocketHandler = (...args: unknown[]) => void;

interface SocketEventMap {
  // Client → server
  "join-project": (data: { projectId: string }) => void;
  "leave-project": (data: { projectId: string }) => void;
  "join-chat": (data: { chatId: string }) => void;
  "leave-chat": (data: { chatId: string }) => void;
  "typing-start": (data: { chatId: string }) => void;
  "typing-stop": (data: { chatId: string }) => void;
  "cursor-move": (data: { chatId?: string; projectId?: string; x: number; y: number }) => void;
  "document-operation": (data: {
    resourceType: string;
    resourceId: string;
    operation: Record<string, unknown>;
    baseVersion: number;
    version: number;
  }) => void;
  // Server → client
  "presence-update": (data: { userId: string; projectId?: string; chatId?: string; status: string }) => void;
  "user-typing": (data: { userId: string; chatId: string; isTyping: boolean }) => void;
  "user-joined": (data: { userId: string }) => void;
  "user-left": (data: { userId: string }) => void;
  "conflict-detected": (data: { resourceType: string; resourceId: string; pendingOps: Record<string, unknown>[]; strategy: string }) => void;
  "user-offline": (data: { userId: string }) => void;
  "project-updated": (data: { projectId: string; changes: Record<string, unknown> }) => void;
  "chat-updated": (data: { chatId: string; changes: Record<string, unknown> }) => void;
}

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, reconnectAttempts = 10, reconnectDelay = 1000, maxReconnectDelay = 30000 } = options;
  const { getToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const eventHandlersRef = useRef<Map<keyof SocketEventMap, Set<SocketHandler>>>(new Map());
  const [socket, setSocket] = useState<Socket | null>(null);

  const connect = useCallback(async () => {
    if (socketRef.current?.connected) return;

    const token = await getToken();
    if (!token) return;

    const socket = io(window.location.origin, {
      path: "/api/socket",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: reconnectAttempts,
      reconnectionDelay: reconnectDelay,
      reconnectionDelayMax: maxReconnectDelay,
      randomizationFactor: 0.5,
    });

    socket.on("connect", () => {
      setConnected(true);
      setReconnectCount(0);
      options.onConnect?.();
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      options.onDisconnect?.(reason);
    });

    socket.on("connect_error", (error) => {
      options.onError?.(error);
    });

    socket.on("reconnect", (attemptNumber) => {
      setReconnectCount(attemptNumber);
    });

       socketRef.current = socket;
    setSocket(socket);

    // Replay any handlers registered before the socket finished connecting.
    for (const [event, handlers] of eventHandlersRef.current) {
      for (const handler of handlers) {
        socket.on(event as string, handler as (...args: unknown[]) => void);
      }
    }
  }, [getToken, reconnectAttempts, reconnectDelay, maxReconnectDelay, options]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
  }, []);

  const emit = useCallback(<K extends keyof SocketEventMap>(
    event: K,
    data: Parameters<SocketEventMap[K]>[0]
  ) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback(<K extends keyof SocketEventMap>(
    event: K,
    handler: SocketEventMap[K]
  ) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)?.add(handler as unknown as SocketHandler);
    const listener = handler as (...args: unknown[]) => void;
    socketRef.current?.on(event as string, listener);

    return () => {
      eventHandlersRef.current.get(event)?.delete(handler as unknown as SocketHandler);
      socketRef.current?.off(event as string, listener);
    };
  }, []);

  const off = useCallback(<K extends keyof SocketEventMap>(
    event: K,
    handler: SocketEventMap[K]
  ) => {
    eventHandlersRef.current.get(event)?.delete(handler as unknown as SocketHandler);
    const listener = handler as (...args: unknown[]) => void;
    socketRef.current?.off(event as string, listener);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return { socket, connected, reconnectCount, emit, on, off, connect, disconnect };
}
