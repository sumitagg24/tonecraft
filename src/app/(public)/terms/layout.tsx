import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Terms of Service — ToneCraft",
  description:
    "The terms and conditions governing your use of ToneCraft — accounts, subscriptions, acceptable use, and liability.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
