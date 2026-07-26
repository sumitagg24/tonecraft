"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import {
  Search, Command, Bell, Sun, Moon, Sparkles,
  Settings, LogOut, CreditCard, ChevronDown,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "@/hooks/use-command-palette";

export function TopNavigation() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const { signOut } = useClerk();
  const router = useRouter();
  const { open } = useCommandPalette();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const initials = user
    ? [user.firstName, user.lastName].filter(Boolean).map(n => n?.[0]).join("").toUpperCase() || "?"
    : "?";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled ? "glass-nav shadow-sm" : "bg-transparent"
      )}
    >
      <div className="flex h-14 items-center gap-3 px-4">
        <button
          onClick={open}
          className="flex flex-1 max-w-md items-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground hover:border-border/60 hover:bg-muted/50 transition-all"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search anything...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border/30 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-foreground" onClick={open}>
            <Command className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 rounded-xl pl-1.5 pr-3">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                  {user?.firstName || "User"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/40">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.firstName || "User"}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")} className="rounded-lg cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/billing")} className="rounded-lg cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" /> Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })} className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
