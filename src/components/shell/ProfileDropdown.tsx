"use client";

import { CreditCard, FileText, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Gemini from "../icons/gemini";

interface Profile {
  name: string;
  email: string;
  avatar: string;
  subscription?: string;
  model?: string;
}

interface MenuItem {
  label: string;
  value?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: "blue" | "purple";
}

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Profile;
  onSignOut?: () => void;
}

export default function ProfileDropdown({
  data,
  onSignOut,
  className,
  ...props
}: ProfileDropdownProps) {
  const initials = React.useMemo(() => {
    return [data.name?.split(" ")[0]?.[0], data.name?.split(" ")[1]?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";
  }, [data.name]);

  const menuItems: MenuItem[] = [
    { label: "Profile", href: "/settings?tab=profile", icon: User },
    { label: "Model", value: data.model, href: "/settings", icon: Gemini, badge: "blue" },
    { label: "Subscription", value: data.subscription, href: "/billing", icon: CreditCard, badge: "purple" },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Terms & Policies", href: "/terms", icon: FileText },
  ];

  return (
    <div className={cn("relative", className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/60 px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open user menu"
          >
            <Avatar className="h-8 w-8 border border-border/40">
              {data.avatar ? (
                <AvatarImage src={data.avatar} alt={data.name || "User"} />
              ) : (
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              )}
            </Avatar>
            <span className="hidden sm:flex flex-1 min-w-0">
              <span className="truncate font-medium text-foreground">{data.name || "Account"}</span>
              <span className="mx-1 text-muted-foreground/40">·</span>
              {data.subscription ? (
                <span
                  className={cn(
                    "truncate text-xs font-medium",
                    data.subscription === "FREE"
                      ? "text-muted-foreground"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {data.subscription}
                </span>
              ) : (
                <span className="truncate text-xs text-muted-foreground/60">…</span>
              )}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="w-56 rounded-xl border border-border/30 bg-popover p-1 text-sm shadow-lg"
        >
          <DropdownMenuLabel className="px-2 py-1.5">
            <div className="font-medium text-foreground">{data.name || "Account"}</div>
            <div className="truncate text-xs text-muted-foreground">{data.email}</div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-1" />

          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem asChild key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground/90 hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="h-4 w-4 text-muted-foreground/70" />
                  <span>{item.label}</span>
                  {item.value && (
                    <span
                      className={cn(
                        "ml-auto rounded-md px-1.5 py-0.5 text-xs font-medium",
                        item.badge === "blue"
                          ? "border border-blue-500/15 bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                          : "border border-purple-500/15 bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400"
                      )}
                    >
                      {item.value}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem asChild>
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground/80 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/15"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
