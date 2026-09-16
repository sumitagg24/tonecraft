import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * The Clerk dashboard webhook (`/api/webhook/clerk`) is the primary path for
 * syncing profile data, but it can lag or be unconfigured — every user row
 * created by the lazy sync in `auth()` starts with a placeholder address.
 * Anything that leaves the platform (Dodo checkout customer email, SMTP
 * receipts) must never use a placeholder: Dodo would email receipts into the
 * void and the webhook's email-fallback user resolution would silently fail.
 */

const PLACEHOLDER_DOMAIN = "@clerk.local";

/** True for empty addresses and lazy-sync placeholders. */
export function isPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  return email.endsWith(PLACEHOLDER_DOMAIN);
}

/**
 * Authoritative primary email straight from Clerk. Returns null when the
 * lookup fails (network/Clerk outage) — callers decide whether to proceed
 * with a degraded value or fail loudly.
 */
export async function fetchClerkPrimaryEmail(clerkId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkId);
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    );
    const email = primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
    if (!email) {
      logger.warn("[clerk-email] No email addresses on Clerk user", { clerkId });
      return null;
    }
    return email;
  } catch (err) {
    logger.error("[clerk-email] Clerk user lookup failed", { clerkId }, err instanceof Error ? err : undefined);
    return null;
  }
}

/**
 * Resolve a usable email for `dbUserId`, backfilling the row from Clerk when
 * it currently holds a placeholder. Returns the real email, or null when it
 * cannot be determined (placeholder retained in the DB in that case).
 */
export async function ensureRealEmail(
  dbUserId: string,
  clerkId: string,
  currentEmail: string | null,
): Promise<string | null> {
  if (!isPlaceholderEmail(currentEmail)) return currentEmail;
  const real = await fetchClerkPrimaryEmail(clerkId);
  if (!real) return null;
  try {
    await prisma.user.update({
      where: { id: dbUserId },
      data: { email: real },
    });
  } catch (err) {
    logger.error("[clerk-email] Email backfill failed", { dbUserId }, err instanceof Error ? err : undefined);
  }
  return real;
}

/**
 * Fire-and-forget backfill for request-hot paths (`auth()`). Only triggers
 * for placeholder rows, so steady-state cost is zero — one Clerk lookup per
 * affected user, ever.
 */
export function backfillEmailInBackground(
  dbUserId: string,
  clerkId: string,
  currentEmail: string | null,
): void {
  if (!isPlaceholderEmail(currentEmail)) return;
  void ensureRealEmail(dbUserId, clerkId, currentEmail).catch(() => {});
}
