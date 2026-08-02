"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Zap, Users, BookOpen, Download, CreditCard, AtSign, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/styles/motion";
import { useNotifications } from "@/hooks/use-notifications";

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

export function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { notifications, unread, markRead, markAllRead, clearAll, refresh } = useNotifications();

  const openItem = useCallback(async (n: NotificationItem) => {
    setOpen(false);
    if (!n.readAt) {
      await markRead(n.id);
    }
    if (n.link) router.push(n.link);
  }, [markRead, router]);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((v) => !v); if (!open) refresh(); }}
        className="relative h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-all"
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-nano font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: duration.fast, ease: ease.default }}
              className="absolute right-0 top-full mt-1.5 z-50 w-80 rounded-xl border border-border/40 bg-popover shadow-premium overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/20">
                <span className="text-xs font-semibold">Notifications</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={markAllRead}
                    className="h-6 px-1.5 rounded-md flex items-center gap-1 text-micro text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    aria-label="Mark all read"
                  >
                    <CheckCheck className="w-3 h-3" /> Read all
                  </button>
                  <button
                    onClick={clearAll}
                    className="h-6 px-1.5 rounded-md flex items-center gap-1 text-micro text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    aria-label="Clear all"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground/50">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = TYPE_ICONS[n.type] ?? Bell;
                    const unreadNow = !n.readAt;
                    return (
                      <button
                        key={n.id}
                        onClick={() => openItem(n)}
                        className={cn(
                          "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/20",
                          unreadNow && "bg-primary/[0.04]"
                        )}
                      >
                        <span className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          unreadNow ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground/60"
                        )}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium truncate">{n.title}</span>
                          {n.body && <span className="block text-tiny text-muted-foreground/70 line-clamp-2 mt-0.5">{n.body}</span>}
                          <span className="block text-nano text-muted-foreground/40 mt-1">
                            {new Date(n.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        </span>
                        {unreadNow && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
