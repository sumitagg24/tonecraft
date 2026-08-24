"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-loaded Clerk SignUp component. The heavy Clerk JS bundle is only
 * fetched after the shell (Logo + container) has painted, cutting perceived
 * load time by ~1-2 s on slow connections.
 */
const SignUp = dynamic(
  () => import("@clerk/nextjs").then((m) => m.SignUp),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-xl bg-muted/30" /> }
);

export function ClerkSignUp({ fallbackRedirectUrl }: { fallbackRedirectUrl?: string }) {
  return <SignUp fallbackRedirectUrl={fallbackRedirectUrl} />;
}
