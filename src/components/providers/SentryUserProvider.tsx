"use client";

import * as Sentry from "@sentry/nextjs";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

/**
 * Keeps the Sentry scope in sync with the signed-in Clerk user so every
 * client-side signal — errors, transactions, and session replays — is
 * attributed to the user who triggered it.
 *
 * - Sets `Sentry.setUser` when a session is present (id, email, username).
 * - Clears it on sign-out (`Sentry.setUser(null)`).
 * - No-op when the SDK isn't initialized (no DSN configured).
 *
 * Mounted inside <ClerkProvider> in the root layout.
 */
export function SentryUserProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();

  // Depend on primitives, not the `user` object identity — Clerk can hand out
  // new object references on unrelated re-renders, which would re-run the
  // effect (and re-set the scope) needlessly.
  const userId = user?.id ?? null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const username = user?.username ?? null;

  useEffect(() => {
    if (!Sentry.getClient()) return; // SDK not initialized — no DSN configured
    if (!isLoaded) return;

    if (isSignedIn && userId) {
      Sentry.setUser({
        id: userId,
        email: email ?? undefined,
        username: username ?? undefined,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [isLoaded, isSignedIn, userId, email, username]);

  return <>{children}</>;
}
