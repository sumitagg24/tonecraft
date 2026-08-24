"use client";

import { useRealtime } from "@/hooks/use-realtime";

/**
 * Mounts the shared Socket.IO connection for the signed-in shell. The hook is
 * idempotent — the chat page and composer also call useRealtime and simply
 * reuse the same singleton connection.
 */
export function RealtimeConnection() {
  useRealtime();
  return null;
}
