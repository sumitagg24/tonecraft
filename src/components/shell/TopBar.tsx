"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useUser, useClerk } from "@clerk/nextjs";
import { useNavigationStore } from "@/stores/navigation-store";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useChat } from "@/hooks/use-chat";
import { NAV_ITEMS } from "./nav-items";
import {
  PanelLeft, Command, Plus, Moon, Sun, MessageSquareHeart,
} from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import ProfileDropdown from "./ProfileDropdown";
import { useUserProfile } from "@/hooks/use-user-profile";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";

function getTitle(pathname: string): { title: string; crumb?: string } {
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return { title: "Compose" };
  if (pathname === "/tools") return { title: "Tools" };
  if (pathname === "/library") return { title: "Library" };
  if (pathname === "/search") return { title: "Search" };
  if (pathname === "/docs" || pathname.startsWith("/docs")) return { title: "Docs" };
  if (pathname === "/notes" || pathname.startsWith("/notes")) return { title: "Notes" };
  if (pathname === "/tasks" || pathname.startsWith("/tasks")) return { title: "Tasks" };
  if (pathname === "/calendar" || pathname.startsWith("/calendar")) return { title: "Calendar" };
  if (pathname === "/automations" || pathname.startsWith("/automations")) return { title: "Automations" };
  if (pathname === "/notifications" || pathname.startsWith("/notifications")) return { title: "Notifications" };
  if (pathname === "/analytics" || pathname.startsWith("/analytics")) return { title: "Analytics" };
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return { title: "Workspace Admin" };
  if (pathname === "/settings" || pathname.startsWith("/settings")) return { title: "Account" };
  if (pathname === "/billing") return { title: "Account", crumb: "Billing" };
  return { title: "ToneCraft" };
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  // next-themes returns undefined until the client mounts; rendering the icon
  // before that causes a server/client hydration mismatch (Sun vs Moon).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { user } = useUser();
  const { signOut } = useClerk();
  const { subscription, loading: profileLoading } = useUserProfile();
  const { toggleRailCollapsed, setMobileNavOpen } = useNavigationStore();
  const { toggle } = useCommandPalette();
  const { createChat } = useChat();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { title, crumb } = getTitle(pathname);
  const activeItem = NAV_ITEMS.find((item) =>
    pathname === item.href || pathname.startsWith(`${item.href}/`) ||
    (item.id === "account" && (pathname === "/billing" || pathname.startsWith("/billing")))
  );
  const label = activeItem?.label ?? title;

  const handleNewChat = async () => {
    const chat = await createChat();
    router.push(`/chat/${chat.id}`);
  };

  return (
    <header className="shrink-0 h-14 flex items-center justify-between gap-3 px-4 md:px-6 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all border border-border/40"
          aria-label="Open navigation"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <button
          onClick={toggleRailCollapsed}
          className="hidden md:flex h-9 w-9 rounded-xl items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-muted/40 transition-all border border-border/40"
          aria-label="Collapse navigation"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="flex items-baseline gap-2 min-w-0">
          <h1 className="text-base font-semibold truncate font-display tracking-tight text-foreground">{crumb ? "Account" : label}</h1>
          {crumb && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-sm text-muted-foreground truncate">{crumb}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleNewChat}
          className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-medium text-background bg-foreground hover:bg-foreground/90 shadow-editorial transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          New Workspace
        </button>

        <button
          onClick={toggle}
          className="h-9 px-3 rounded-xl flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/40 transition-all"
          aria-label="Command palette"
        >
          <Command className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setFeedbackOpen(true)}
          className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/40 transition-all"
          aria-label="Send feedback"
        >
          <MessageSquareHeart className="w-3.5 h-3.5" />
          Feedback
        </button>

        <NotificationCenter />

        <motion.button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95, rotate: 12 }}
          transition={{ duration: 0.15 }}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/40 transition-all"
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
          ) : (
            <span className="w-4 h-4" aria-hidden="true" />
          )}
        </motion.button>

        <ProfileDropdown
          data={{
            name: user?.fullName || user?.firstName || "",
            email: user?.primaryEmailAddress?.emailAddress || "",
            avatar: user?.imageUrl || "",
            subscription: profileLoading ? undefined : subscription,
          }}
          onSignOut={() => signOut({ redirectUrl: "/" })}
        />
      </div>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </header>
  );
}
