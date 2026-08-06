import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ReducedMotionProvider } from "@/hooks/use-reduced-motion";
import { GlobalEffects } from "@/components/shared/Effects";
import "@/lib/startup-validation";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "ToneCraft — AI Communication Platform",
  description:
    "Write Once. Speak Perfectly. Everywhere. ToneCraft rewrites your messages for every platform and tone.",
  openGraph: {
    title: "ToneCraft — AI Communication Platform",
    description:
      "Write Once. Speak Perfectly. Everywhere. Transform your messages for every platform with AI.",
    url: "https://tonecraft.ai",
    siteName: "ToneCraft",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ToneCraft — AI Communication Platform",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ToneCraft — AI Communication Platform",
    description:
      "Write Once. Speak Perfectly. Everywhere. Transform your messages for every platform with AI.",
    creator: "@tonecraft",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans min-h-screen antialiased bg-background text-foreground">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ReducedMotionProvider>
              {children}
              <GlobalEffects />
              <Toaster position="bottom-right" />
            </ReducedMotionProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
