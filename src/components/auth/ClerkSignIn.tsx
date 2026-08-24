"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-loaded Clerk SignIn component. The heavy Clerk JS bundle is only
 * fetched after the shell (Logo + container) has painted, cutting perceived
 * load time by ~1-2 s on slow connections.
 */
const SignIn = dynamic(
  () => import("@clerk/nextjs").then((m) => m.SignIn),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-xl bg-muted/30" /> }
);

export function ClerkSignIn({ fallbackRedirectUrl }: { fallbackRedirectUrl?: string }) {
  return <SignIn fallbackRedirectUrl={fallbackRedirectUrl} />;
}
