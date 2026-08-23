import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "ToneCraft System Status — Service Health",
  description:
    "Real-time status of ToneCraft services: PostgreSQL, Redis, Clerk Auth, Paddle Billing, and AI backends.",
  path: "/status",
});

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
