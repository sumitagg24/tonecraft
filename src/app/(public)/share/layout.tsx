import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Chat — ToneCraft",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
