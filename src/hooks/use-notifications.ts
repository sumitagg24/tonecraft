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
    const es = new EventSource("/api/notifications/stream");
    eventSourceRef.current = es;

    es.addEventListener("message", (event) => {
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
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
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
