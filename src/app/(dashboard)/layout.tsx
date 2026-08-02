"use client";
import { AppShell } from "@/components/shell/AppShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="h-full animate-content-in">
        {children}
      </div>
    </AppShell>
  );
}
