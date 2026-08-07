"use client";
import { NavigationRail, MobileRailDrawer } from "./NavigationRail";
import { TopBar } from "./TopBar";
import { MobileBottomBar } from "./MobileBottomBar";
import { CommandPalette } from "@/components/layout/CommandPalette";

import { TooltipProvider } from "@/components/ui/tooltip";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
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
