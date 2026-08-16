import type { Server as SocketIOServer } from "socket.io";

/**
 * Shared handle to the active Socket.IO server.
 *
 * The server is created in src/app/api/socket/route.ts (the only place that
 * mounts one — it verifies the Clerk JWT and enforces chat/project access on
 * every room join). Services like NotificationService need to broadcast into
 * rooms, so the route registers its instance here instead of each service
 * creating (or importing) its own — the old src/lib/socket.ts duplicate had no
 * access checks and was never mounted.
 *
 * Returns null until the socket route has been hit at least once (serverless
 * cold start) — callers must treat null as "no live clients".
 */
let ioInstance: SocketIOServer | null = null;

export function setRealtimeServer(io: SocketIOServer): void {
  ioInstance = io;
}

export function getRealtimeServer(): SocketIOServer | null {
  return ioInstance;
}
