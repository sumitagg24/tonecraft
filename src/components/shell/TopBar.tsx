"use client";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";
import { useNavigationStore } from "@/stores/navigation-store";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useChat } from "@/hooks/use-chat";
import { NAV_ITEMS } from "./nav-items";
import {
  PanelLeft, Command, Plus, Moon, Sun, LogOut, CreditCard, User,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getTitle(pathname: string): { title: string; crumb?: string } {
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return { title: "Compose" };
  if (pathname === "/tools") return { title: "Tools" };
  if (pathname === "/library") return { title: "Library" };
  if (pathname === "/search") return { title: "Search" };
  if (pathname === "/settings" || pathname.startsWith("/settings")) return { title: "Account" };
  if (pathname === "/billing") return { title: "Account", crumb: "Billing" };
  return { title: "ToneCraft" };
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { toggleRailCollapsed, setMobileNavOpen } = useNavigationStore();
  const { toggle } = useCommandPalette();
  const { createChat } = useChat();

  const { title, crumb } = getTitle(pathname);
  const activeItem = NAV_ITEMS.find((item) =>
    pathname === item.href || pathname.startsWith(`${item.href}/`) ||
    (item.id === "account" && (pathname === "/billing" || pathname.startsWith("/billing")))
  );
  const label = activeItem?.label ?? title;

  const initials = user
    ? [user.firstName, user.lastName].filter(Boolean).map((n) => n?.[0]).join("").toUpperCase() || "?"
    : "?";

  const handleNewChat = async () => {
    const chat = await createChat();
    router.push(`/chat/${chat.id}`);
  };

  return (
    <header className="shrink-0 h-12 flex items-center justify-between gap-2 px-3 md:px-4 border-b border-border/20 bg-background/60 backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          aria-label="Open navigation"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <button
          onClick={toggleRailCollapsed}
          className="hidden md:flex h-8 w-8 rounded-lg items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-all"
          aria-label="Collapse navigation"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="flex items-baseline gap-2 min-w-0">
          <h1 className="text-sm font-semibold truncate">{crumb ? "Account" : label}</h1>
          {crumb && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-sm text-muted-foreground truncate">{crumb}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleNewChat}
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </button>

        <button
          onClick={toggle}
          className="h-8 px-2.5 rounded-lg flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 border border-border/30 transition-all"
          aria-label="Command palette"
        >
          <Command className="w-3.5 h-3.5" />
          <kbd className="hidden sm:inline-flex text-[10px] font-mono text-muted-foreground/50">⌘K</kbd>
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-all"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
            <Avatar className="h-8 w-8 border border-border/40">
              {user?.hasImage ? <AvatarImage src={user.imageUrl} alt={user?.firstName || "User"} /> : null}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Signed in"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <User className="w-4 h-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/billing")}>
              <CreditCard className="w-4 h-4" /> Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
              <LogOut className="w-4 h-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
