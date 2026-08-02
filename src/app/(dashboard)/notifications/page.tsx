"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, Filter, ChevronDown,
  Clock, Zap, Download, CreditCard, AtSign, Users, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  generation_finished: Zap,
  credits_low: CreditCard,
  team_invite: Users,
  knowledge_indexed: BookOpen,
  export_completed: Download,
  export_failed: Download,
  mention: AtSign,
  subscription: CreditCard,
};

const TYPE_LABELS: Record<string, string> = {
  generation_finished: "Generation",
  credits_low: "Credits",
  team_invite: "Invite",
  knowledge_indexed: "Knowledge",
  export_completed: "Export",
  export_failed: "Export Failed",
  mention: "Mention",
  subscription: "Subscription",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api<{ notifications: NotificationItem[]; unread: number }>("/api/notifications?limit=50");
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
    const timer = setTimeout(fetchNotifications, 0);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnread((u) => Math.max(0, u - 1));
    await api("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => undefined);
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnread(0);
    await api("/api/notifications", { method: "PATCH" }).catch(() => undefined);
    toast.success("All notifications marked as read");
  }, []);

  const clearAll = useCallback(async () => {
    setItems([]);
    setUnread(0);
    await api("/api/notifications?all=true", { method: "DELETE" }).catch(() => undefined);
    toast.success("Notifications cleared");
  }, []);

  const filtered = items.filter((n) => {
    if (filter === "unread" && n.readAt) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const types = [...new Set(items.map((n) => n.type))];

  const openItem = useCallback(
    async (n: NotificationItem) => {
      if (!n.readAt) await markRead(n.id);
      if (n.link) router.push(n.link);
    },
    [markRead, router]
  );

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unread > 0 ? `${unread} unread` : "No unread notifications"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Mark all read
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear all
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                {typeFilter === "all" ? "All types" : TYPE_LABELS[typeFilter] ?? typeFilter}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setTypeFilter("all")}>All types</DropdownMenuItem>
              {types.map((t) => (
                <DropdownMenuItem key={t} onClick={() => setTypeFilter(t)}>
                  {TYPE_LABELS[t] ?? t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1.5">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Unread
              {unread > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px]">
                  {unread}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {filtered.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                const unreadNow = !n.readAt;
                return (
                  <motion.button
                    key={n.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => openItem(n)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-muted/30",
                      unreadNow && "bg-primary/[0.04]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        unreadNow ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground/60"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">{n.title}</span>
                      {n.body && (
                        <span className="block text-xs text-muted-foreground/70 line-clamp-2 mt-0.5">
                          {n.body}
                        </span>
                      )}
                      <span className="block text-[10px] text-muted-foreground/40 mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(n.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {unreadNow && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1" />
                        )}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}