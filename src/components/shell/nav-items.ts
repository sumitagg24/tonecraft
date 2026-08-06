import {
  MessageSquare, Wand2, Library as LibraryIcon, Search, Bell, BarChart3, Settings,
  ShieldCheck, FileText, StickyNote, ListChecks, CalendarDays, Bot, Workflow, Plug,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

const compose: NavItem = { id: "compose", label: "Compose", href: "/chat", icon: MessageSquare, shortcut: "1" };
const tools: NavItem = { id: "tools", label: "Tools", href: "/tools", icon: Wand2, shortcut: "2" };
const library: NavItem = { id: "library", label: "Library", href: "/library", icon: LibraryIcon, shortcut: "3" };
const search: NavItem = { id: "search", label: "Search", href: "/search", icon: Search, shortcut: "4" };
const docs: NavItem = { id: "docs", label: "Docs", href: "/docs", icon: FileText, shortcut: "5" };
const notes: NavItem = { id: "notes", label: "Notes", href: "/notes", icon: StickyNote, shortcut: "6" };
const tasks: NavItem = { id: "tasks", label: "Tasks", href: "/tasks", icon: ListChecks, shortcut: "7" };
const calendar: NavItem = { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays, shortcut: "8" };
const agents: NavItem = { id: "agents", label: "Agents", href: "/agents", icon: Bot, shortcut: "" };
const automations: NavItem = { id: "automations", label: "Automations", href: "/automations", icon: Workflow, shortcut: "" };
const integrations: NavItem = { id: "integrations", label: "Integrations", href: "/integrations", icon: Plug, shortcut: "" };
const notifications: NavItem = { id: "notifications", label: "Notifications", href: "/notifications", icon: Bell, shortcut: "" };
const analytics: NavItem = { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3, shortcut: "" };
const admin: NavItem = { id: "admin", label: "Admin", href: "/admin", icon: ShieldCheck, shortcut: "" };
const account: NavItem = { id: "account", label: "Account", href: "/settings", icon: Settings, shortcut: "" };

/**
 * Grouped navigation. The rail renders these sections with headers so the
 * growing destination list stays scannable; keyboard shortcuts (⌘1–⌘8) map to
 * the first section. `NAV_ITEMS` remains the flat projection for consumers
 * that need a single ordered list (TopBar, CommandPalette, shortcuts).
 */
export const NAV_SECTIONS: NavSection[] = [
  { id: "create", label: "Create", items: [compose, tools, library, search] },
  { id: "workspace", label: "Workspace", items: [docs, notes, tasks, calendar] },
  { id: "automate", label: "Automate", items: [agents, automations, integrations] },
  { id: "manage", label: "Manage", items: [notifications, analytics, admin, account] },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/** Bottom-bar destinations on small screens — the 5 most-used, not all 15. */
export const MOBILE_NAV_ITEMS: NavItem[] = [compose, tools, library, search, docs];

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
