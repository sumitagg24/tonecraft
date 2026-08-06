import {
  MessageSquare, Wand2, Library as LibraryIcon, Search, Bell, BarChart3, Settings,
  ShieldCheck,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "compose", label: "Compose", href: "/chat", icon: MessageSquare, shortcut: "1" },
  { id: "tools", label: "Tools", href: "/tools", icon: Wand2, shortcut: "2" },
  { id: "library", label: "Library", href: "/library", icon: LibraryIcon, shortcut: "3" },
  { id: "search", label: "Search", href: "/search", icon: Search, shortcut: "4" },
  { id: "notifications", label: "Notifications", href: "/notifications", icon: Bell, shortcut: "5" },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3, shortcut: "6" },
  { id: "admin", label: "Admin", href: "/admin", icon: ShieldCheck, shortcut: "7" },
  { id: "account", label: "Account", href: "/settings", icon: Settings, shortcut: "" },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.id === "account") {
    return pathname === "/settings" || pathname.startsWith("/settings") || pathname.startsWith("/billing");
  }
  if (item.id === "analytics") {
    return pathname === "/analytics" || pathname.startsWith("/analytics");
  }
  if (item.id === "admin") {
    return pathname === "/admin" || pathname.startsWith("/admin");
  }
  if (item.id === "compose") {
    return pathname === "/chat" || pathname.startsWith("/chat/");
  }
  if (item.id === "notifications") {
    return pathname === "/notifications" || pathname.startsWith("/notifications");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
