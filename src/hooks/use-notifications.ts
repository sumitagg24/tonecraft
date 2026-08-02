"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsData {
  notifications: NotificationItem[];
  unread: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api<NotificationsData>("/api/notifications?limit=50");
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnread((u) => Math.max(0, u - 1));
    try {
      await api("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      toast.error("Failed to mark notification as read");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnread(0);
    try {
      await api("/api/notifications", { method: "PATCH" });
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnread(0);
    try {
      await api("/api/notifications?all=true", { method: "DELETE" });
      toast.success("Notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchNotifications, 0);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    let retryDelay = 1000;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let es: EventSource | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      es = new EventSource("/api/notifications/stream");
      eventSourceRef.current = es;

      es.addEventListener("message", (event) => {
        retryDelay = 1000; // healthy stream — reset backoff
        try {
          const data = JSON.parse(event.data);
          if (data.type === "unread_count") {
            setUnread(data.count);
          }
        } catch {
          // ignore parse errors from SSE
        }
      });

      es.onerror = () => {
        es?.close();
        eventSourceRef.current = null;
        // Reconnect with exponential backoff (EventSource does not auto-reconnect
        // once we close it). Cap the delay at 30s.
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30000);
      };
    };

    connect();

    // Pause the stream while the tab is hidden, resume when visible
    const handleVisibility = () => {
      if (document.hidden) {
        es?.close();
        eventSourceRef.current = null;
        if (retryTimer) clearTimeout(retryTimer);
      } else if (!eventSourceRef.current && !retryTimer) {
        connect();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      es?.close();
      eventSourceRef.current = null;
      if (retryTimer) clearTimeout(retryTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return {
    notifications,
    unread,
    loading,
    error,
    markRead,
    markAllRead,
    clearAll,
    refresh: fetchNotifications,
  };
}
