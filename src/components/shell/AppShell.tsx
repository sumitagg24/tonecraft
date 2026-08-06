"use client";
import { useRouter } from "next/navigation";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useNavigationStore } from "@/stores/navigation-store";
import { useChat } from "@/hooks/use-chat";
import { NAV_ITEMS } from "./nav-items";
import { NavigationRail, MobileRailDrawer } from "./NavigationRail";
import { TopBar } from "./TopBar";
import { MobileBottomBar } from "./MobileBottomBar";
import { CommandPalette } from "@/components/layout/CommandPalette";

import { TooltipProvider } from "@/components/ui/tooltip";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { toggle } = useCommandPalette();
  const { setMobileNavOpen } = useNavigationStore();
  const { createChat } = useChat();

  const handleNewChat = async () => {
    const chat = await createChat();
    router.push(`/chat/${chat.id}`);
  };

  useKeyboardShortcuts([
    { key: "k", meta: true, handler: () => toggle() },
    { key: "n", meta: true, handler: () => handleNewChat() },
    // ⌘1–⌘8 — one shortcut per numbered destination (kept in sync with NAV_ITEMS).
    ...NAV_ITEMS.filter((item) => item.shortcut).map((item) => ({
      key: item.shortcut,
      meta: true,
      handler: () => router.push(item.href),
    })),
    { key: "f", meta: true, shift: true, handler: () => router.push("/search") },
    { key: "Escape", handler: () => setMobileNavOpen(false) },
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TooltipProvider>
        {/* Desktop rail */}
        <div className="hidden md:block shrink-0">
          <NavigationRail variant="desktop" />
        </div>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin pb-14 md:pb-0">
            {children}
          </main>
        </div>

        {/* Global overlays */}
        <CommandPalette />

        <MobileRailDrawer />
        <MobileBottomBar />
      </TooltipProvider>
    </div>
  );
}
