import { NextRequest } from "next/server";
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import type { Duplex } from "stream";

interface WSMessage {
  type: string;
  workspaceId?: string;
  userId?: string;
  data?: unknown;
}

interface WSConnection {
  ws: WebSocket;
  userId: string;
  workspaceId: string;
}

const connections = new Map<string, Set<WSConnection>>();

function broadcast(workspaceId: string, message: WSMessage, excludeUserId?: string) {
  const room = connections.get(workspaceId);
  if (!room) return;
  const data = JSON.stringify(message);
  room.forEach(conn => {
    if (conn.userId !== excludeUserId && conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(data);
    }
  });
}

function handleMessage(conn: WSConnection, message: WSMessage) {
  switch (message.type) {
    case "presence":
      broadcast(conn.workspaceId!, {
        type: "presence",
        userId: conn.userId,
        data: message.data,
      });
      break;
    case "typing":
      broadcast(conn.workspaceId!, {
        type: "typing",
        userId: conn.userId,
        data: message.data,
      });
      break;
    case "project-update":
      broadcast(conn.workspaceId!, {
        type: "project-update",
        userId: conn.userId,
        data: message.data,
      });
      break;
    case "optimistic-update":
      broadcast(conn.workspaceId!, {
        type: "optimistic-update",
        userId: conn.userId,
        data: message.data,
      }, conn.userId);
      break;
  }
}

export const GET = async (req: NextRequest) => {
  const session = await import("@/lib/auth").then(m => m.auth());
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId) {
    return new Response("Missing workspaceId", { status: 400 });
  }

  const wss = new WebSocketServer({ noServer: true });

  const upgradeHeader = req.headers.get("upgrade");
  if (upgradeHeader !== "websocket") {
    return new Response("Expected websocket upgrade", { status: 400 });
  }

  const { socket, head } = req as unknown as { socket?: Duplex; head?: Buffer };

  if (!socket || !head) {
    return new Response("WebSocket upgrade not supported", { status: 500 });
  }

  return new Promise<Response>((resolve) => {
    wss.handleUpgrade(req as unknown as IncomingMessage, socket, head, (ws) => {
      wss.emit("connection", ws, req as unknown as IncomingMessage);
    });

    wss.on("connection", (ws) => {
      if (!connections.has(workspaceId)) {
        connections.set(workspaceId, new Set());
      }
      const conn: WSConnection = { ws, userId, workspaceId };
      connections.get(workspaceId)!.add(conn);

      ws.send(JSON.stringify({ type: "connected", userId }));

      ws.on("message", (raw) => {
        try {
          const message: WSMessage = JSON.parse(raw.toString());
          handleMessage(conn, message);
        } catch {
          ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        const room = connections.get(workspaceId);
        if (room) {
          room.delete(conn);
          if (room.size === 0) connections.delete(workspaceId);
        }
        broadcast(workspaceId, { type: "presence", userId, data: { online: false } });
      });

      ws.on("error", () => {
        const room = connections.get(workspaceId);
        if (room) {
          room.delete(conn);
          if (room.size === 0) connections.delete(workspaceId);
        }
      });
    });

    resolve(new Response(null, { status: 101 }));
  });
};