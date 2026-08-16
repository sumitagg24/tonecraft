import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Privacy Policy — ToneCraft",
  description:
    "How ToneCraft collects, uses, and protects your data — our privacy policy and data handling practices.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
