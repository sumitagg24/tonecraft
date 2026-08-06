import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface WebSocketMessage {
  type: "presence" | "typing" | "document-update" | "chat-message";
  userId: string;
  workspaceId: string;
  data: Record<string, unknown>;
}

export const useWorkspaceWebSocket = (workspaceId: string) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setConnected(true);
      setWs(socket);
      // Join workspace room
      const userId = localStorage.getItem("userId");
      if (userId) {
        socket.send(
          JSON.stringify({
            type: "join-room",
            workspaceId,
            userId,
          })
        );
      }
    };

    socket.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      setMessages((prev) => [message, ...prev].slice(0, 100)); // Keep last 100 messages
    };

    socket.onclose = () => {
      setConnected(false);
      setWs(null);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [workspaceId]);

  const sendMessage = (message: Omit<WebSocketMessage, "type"> & { type: WebSocketMessage["type"] }) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  return { ws, connected, messages, sendMessage };
};

export const usePresence = (workspaceId: string) => {
  const { on } = useSocket();
  const { setUserPresence, removeUserPresence } = useWorkspaceStore.getState();

  useEffect(() => {
    const handlePresence = (data: { userId: string; status: string }) => {
      setUserPresence(data.userId, { online: data.status === "active" });
    };

    const handleUserJoined = (data: { userId: string }) => {
      setUserPresence(data.userId, {
        online: true,
        userId: data.userId,
        name: "",
        email: "",
        image: null,
        role: "member",
      });
    };

    const handleUserLeft = (data: { userId: string }) => {
      removeUserPresence(data.userId);
    };

    const offPresence = on("presence-update", handlePresence);
    const offJoined = on("user-joined", handleUserJoined);
    const offLeft = on("user-left", handleUserLeft);

    return () => {
      offPresence?.();
      offJoined?.();
      offLeft?.();
    };
  }, [on, workspaceId]);
};

export const useTypingIndicator = (workspaceId: string, _userId: string) => {
  const { on, emit } = useSocket();
  const { addTypingUser, removeTypingUser } = useWorkspaceStore.getState();

  useEffect(() => {
    const handleTyping = (data: { userId: string; chatId: string; isTyping: boolean }) => {
      if (data.isTyping) {
        addTypingUser(data.userId);
      } else {
        removeTypingUser(data.userId);
      }
    };

    const offTyping = on("user-typing", handleTyping);

    return () => {
      offTyping?.();
    };
  }, [on, workspaceId]);

  const sendTyping = (isTyping: boolean, channelId: string) => {
    emit(isTyping ? "typing-start" : "typing-stop", { chatId: channelId });
  };

  return { sendTyping };
};
