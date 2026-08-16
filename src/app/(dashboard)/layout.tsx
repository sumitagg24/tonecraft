import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { PageTransitionWrapper } from "@/components/shared/PageTransitionWrapper";

// The entire authenticated application must never appear in search results.
// robots.txt also disallows these paths, but this is the defense-in-depth
// layer: crawlers that ignore robots.txt still get an explicit noindex.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  title: "ToneCraft Studio",
};

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
