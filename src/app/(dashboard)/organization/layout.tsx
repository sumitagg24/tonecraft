"use client";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Users, UsersRound, ShieldCheck, KeyRound, Palette, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ORG_NAV_ITEMS: OrgNavItem[] = [
  { id: "overview", label: "Overview", href: "/organization", icon: Building2 },
  { id: "members", label: "Members", href: "/organization/members", icon: Users },
  { id: "teams", label: "Teams", href: "/organization/teams", icon: UsersRound },
  { id: "security", label: "Security", href: "/organization/security", icon: ShieldCheck },
  { id: "sso", label: "SSO", href: "/organization/sso", icon: KeyRound },
  { id: "branding", label: "Branding", href: "/organization/branding", icon: Palette },
  { id: "audit", label: "Audit Log", href: "/organization/audit", icon: FileText },
];

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-full">
      <nav className="shrink-0 w-60 border-r border-border/20 bg-muted/10 overflow-y-auto">
        <div className="p-4 border-b border-border/20">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Organization
          </h2>
          <p className="text-[11px] text-muted-foreground/70 mt-1">Company · Teams · Workspaces</p>
        </div>
        <div className="py-2">
          {ORG_NAV_ITEMS.map((item) => {
            const active = item.id === "overview"
              ? pathname === "/organization"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
