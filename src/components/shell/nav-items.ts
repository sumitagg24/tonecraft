import {
  MessageSquare, Wand2, Library as LibraryIcon, Search, Bell, BarChart3, Settings,
  ShieldCheck, FileText, StickyNote, ListChecks, CalendarDays, Workflow,
  Building2, Store, BrainCircuit,
} from "lucide-react";
import type { FeatureKey } from "@/config/features";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  /** Feature flag key — when set, the item is hidden unless the feature is enabled. */
  feature?: FeatureKey;
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
const automations: NavItem = { id: "automations", label: "Automations", href: "/automations", icon: Workflow, shortcut: "" };
const notifications: NavItem = { id: "notifications", label: "Notifications", href: "/notifications", icon: Bell, shortcut: "" };
const analytics: NavItem = { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3, shortcut: "" };
const admin: NavItem = { id: "admin", label: "Admin", href: "/admin", icon: ShieldCheck, shortcut: "" };
const marketplace: NavItem = { id: "marketplace", label: "Marketplace", href: "/marketplace", icon: Store, shortcut: "", feature: "marketplace" };
const memory: NavItem = { id: "memory", label: "Memory", href: "/memory", icon: BrainCircuit, shortcut: "", feature: "memory" };
const organization: NavItem = { id: "organization", label: "Organization", href: "/organization", icon: Building2, shortcut: "" };
const account: NavItem = { id: "account", label: "Account", href: "/settings", icon: Settings, shortcut: "" };

/**
 * Grouped navigation. The rail renders these sections with headers so the
 * growing destination list stays scannable; keyboard shortcuts (⌘1–⌘8) map to
 * the first section. `NAV_ITEMS` remains the flat projection for consumers
 * that need a single ordered list (TopBar, CommandPalette, shortcuts).
 */
/**
 * Communication-first navigation (audit 11.4): the primary "Create" section
 * stays on top with the destinations people use every day (Compose, Tools,
 * Library, Search). Everything else is secondary — grouped into focused
 * sections with the least-used admin/analytics/organization destinations
 * tucked into a final "More" section so the rail stays scannable.
 */
export const NAV_SECTIONS: NavSection[] = [
  { id: "create", label: "Create", items: [compose, tools, library, search] },
  { id: "workspace", label: "Workspace", items: [docs, notes, tasks, calendar] },
  { id: "automate", label: "Automate", items: [automations] },
  { id: "manage", label: "Manage", items: [notifications, account] },
  { id: "more", label: "More", items: [analytics, admin, organization, marketplace, memory] },
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
  if (item.id === "organization") {
    return pathname === "/organization" || pathname.startsWith("/organization");
  }
  if (item.id === "compose") {
    return pathname === "/chat" || pathname.startsWith("/chat/");
  }
  if (item.id === "notifications") {
    return pathname === "/notifications" || pathname.startsWith("/notifications");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
