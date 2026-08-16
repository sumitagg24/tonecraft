import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're offline — ToneCraft",
  robots: { index: false, follow: false },
};

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
