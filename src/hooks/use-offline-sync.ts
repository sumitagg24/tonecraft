"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface PendingAction {
  id: string;
  type: string;
  url: string;
  method: "POST" | "PUT" | "DELETE" | "PATCH";
  payload: unknown;
  timestamp: number;
}

const STORAGE_KEY = "tonecraft_offline_queue_v1";

export function getOfflineQueue(): PendingAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: PendingAction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    /* ignore storage errors */
  }
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [queue, setQueue] = useState<PendingAction[]>(getOfflineQueue);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Synchronize online state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online. Syncing offline changes...");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are offline. Changes will be saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Enqueue action when offline
  const enqueueAction = useCallback((action: Omit<PendingAction, "id" | "timestamp">) => {
    const item: PendingAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    setQueue((prev) => {
      const updated = [...prev, item];
      saveOfflineQueue(updated);
      return updated;
    });
    toast.info("Action saved offline. It will process when reconnected.");
    return item.id;
  }, []);

  // Flush queue to backend
  const flushQueue = useCallback(async () => {
    const currentQueue = getOfflineQueue();
    if (currentQueue.length === 0 || !navigator.onLine) return;

    setSyncing(true);
    const remaining: PendingAction[] = [];

    for (const item of currentQueue) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (!res.ok && res.status >= 500) {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    saveOfflineQueue(remaining);
    setQueue(remaining);
    setSyncing(false);

    if (currentQueue.length > remaining.length) {
      toast.success(`Synced ${currentQueue.length - remaining.length} offline item(s).`);
    }
  }, []);

  useEffect(() => {
    if (isOnline && queue.length > 0) {
      flushQueue();
    }
  }, [isOnline, queue.length, flushQueue]);

  return {
    isOnline,
    queue,
    syncing,
    enqueueAction,
    flushQueue,
    pendingCount: queue.length,
  };
}
