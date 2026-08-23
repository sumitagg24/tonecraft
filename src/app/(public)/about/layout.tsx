import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "About ToneCraft — Our Mission & Values",
  description:
    "Learn about ToneCraft: our mission to make AI-powered communication accessible, our focus on clarity and privacy, and the team behind the platform.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
