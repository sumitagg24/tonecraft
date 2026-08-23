import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Terms of Service — ToneCraft",
  description:
    "ToneCraft Terms of Service: acceptable use, user responsibilities, subscriptions, payments, and limitation of liability.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
