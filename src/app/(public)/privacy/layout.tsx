import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Privacy Policy — ToneCraft",
  description:
    "How ToneCraft collects, uses, and protects your data. Full privacy policy covering account data, usage data, encryption, and your rights.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
