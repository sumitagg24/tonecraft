"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { CommandPalette } from "@/components/layout/CommandPalette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceLayout>
        <div className="h-full animate-content-in">
          {children}
        </div>
      </WorkspaceLayout>
      <CommandPalette />
    </QueryClientProvider>
  );
}
