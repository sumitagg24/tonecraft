import type { Metadata } from "next";

// Shared chats are token-gated user content — never index them.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
