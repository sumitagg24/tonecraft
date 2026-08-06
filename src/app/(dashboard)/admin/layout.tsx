"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Database, CreditCard, Folder, Users, BookOpen,
  BarChart3, PieChart, Shield, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: "overview", label: "Overview", href: "/admin", icon: LayoutDashboard },
  { id: "metrics", label: "AI Usage", href: "/admin/usage", icon: BarChart3 },
  { id: "charts", label: "Charts", href: "/admin/charts", icon: PieChart },
  { id: "storage", label: "Storage", href: "/admin/storage", icon: Database },
  { id: "credits", label: "Credits", href: "/admin/credits", icon: CreditCard },
  { id: "projects", label: "Projects", href: "/admin/projects", icon: Folder },
  { id: "members", label: "Members", href: "/admin/members", icon: Users },
  { id: "knowledge", label: "Knowledge", href: "/admin/knowledge", icon: BookOpen },
  { id: "permissions", label: "Permissions", href: "/admin/permissions", icon: Shield },
  { id: "audit", label: "Audit Log", href: "/admin/audit", icon: FileText },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-full">
      <nav className="shrink-0 w-64 border-r border-border/20 bg-muted/10 overflow-y-auto">
        <div className="p-4 border-b border-border/20">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Workspace Admin
          </h2>
        </div>
        <div className="py-2">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
      <div className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
