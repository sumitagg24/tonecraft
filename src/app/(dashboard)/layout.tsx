"use client";
import { AppShell } from "@/components/shell/AppShell";
import { PageTransitionWrapper } from "@/components/shared/PageTransitionWrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <PageTransitionWrapper className="h-full">
        {children}
      </PageTransitionWrapper>
    </AppShell>
  );
}
