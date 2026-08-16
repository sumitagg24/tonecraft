import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "System Status — ToneCraft",
  description:
    "Live status of ToneCraft's services — database, Redis, authentication, payments, and AI providers.",
  path: "/status",
});

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
