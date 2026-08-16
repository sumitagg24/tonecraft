import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "About — ToneCraft",
  description:
    "ToneCraft is an AI communication platform helping you express yourself perfectly across every platform and tone — our mission, story, and values.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
