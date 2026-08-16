import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SentryUserProvider } from "@/components/providers/SentryUserProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ReducedMotionProvider } from "@/hooks/use-reduced-motion";
import { GlobalEffects } from "@/components/shared/Effects";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import { PaddleCheckoutAutoOpen } from "@/components/shared/PaddleCheckoutAutoOpen";
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, OG_IMAGE } from "@/lib/site";
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

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Every public page sets its own full title (already carrying the brand, e.g.
  // "Pricing — ToneCraft"), so no title template — it would only double the brand.
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: `${SITE_URL}${OG_IMAGE}`, width: 1200, height: 630, alt: SITE_TITLE }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@tonecraft",
    images: [`${SITE_URL}${OG_IMAGE}`],
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
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    // ToneCraft is dark-first; light is the opt-in.
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
          <SentryUserProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              disableTransitionOnChange
            >
              <ReducedMotionProvider>
                {children}
                <GlobalEffects />
                <ServiceWorkerRegistration />
                <PaddleCheckoutAutoOpen />
                <Toaster position="bottom-right" />
              </ReducedMotionProvider>
            </ThemeProvider>
          </SentryUserProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
