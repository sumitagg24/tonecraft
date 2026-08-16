import { prisma } from "@/lib/prisma";

/**
 * Global (platform-level) admin authorization.
 *
 * There is no `role` column on User — workspace admin is tracked per-workspace
 * via WorkspaceMember. Platform-level surfaces (the /api/admin/* metrics and
 * the /admin/feedback queue) are gated on the user's email appearing in the
 * ADMIN_EMAILS environment variable (comma-separated, e.g.
 * `ADMIN_EMAILS=ops@tonecraft.app,support@tonecraft.app`).
 *
 * Fail-closed contract: when ADMIN_EMAILS is unset/empty, NO user is an admin.
 * Never hardcode an email address here — the list is operator-controlled.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isGlobalAdminConfigured(): boolean {
  return ADMIN_EMAILS.length > 0;
}

/**
 * True when the user's verified email is in ADMIN_EMAILS.
 * Users whose row was lazy-synced with a temp email (temp-…@clerk.local)
 * can never match, which is the correct fail-closed behavior.
 */
export async function isGlobalAdmin(userId: string): Promise<boolean> {
  if (ADMIN_EMAILS.length === 0) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return false;

  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}
