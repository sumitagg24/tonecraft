import { auth as clerkAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { backfillEmailInBackground } from "@/lib/clerk-email";
import type { User } from "@prisma/client";

export async function auth() {
  const { userId } = await clerkAuth();
  if (!userId) return null;

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, email: true },
    });
  } catch (e) {
    logger.error("Auth database query failed", { userId }, e instanceof Error ? e : undefined);
    throw e;
  }

  // Lazy sync: webhook might not have fired yet
  if (!user) {
    try {
      user = await prisma.user.create({
        data: { clerkId: userId, email: `temp-${userId}@clerk.local` },
        select: { id: true, email: true },
      });
    } catch (e) {
      logger.warn("auth: user create failed (race condition)", { userId, error: e instanceof Error ? e.message : String(e) });
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, email: true },
      });
    }
    // A brand-new lazy row always starts with a placeholder email — kick off
    // a backfill from Clerk so downstream consumers (checkout, SMTP) see the
    // real address even if the dashboard webhook never fires.
    if (user) backfillEmailInBackground(user.id, userId, user.email);
  } else {
    // Self-healing for rows created before the backfill existed: one Clerk
    // lookup per affected user, ever (no-op once the email is real).
    backfillEmailInBackground(user.id, userId, user.email);
  }

  if (!user) return null;
  return { user: { id: user.id } };
}

export async function getAuthUser(): Promise<User | null> {
  const { userId } = await clerkAuth();
  if (!userId) return null;

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    try {
      user = await prisma.user.create({
        data: { clerkId: userId, email: `temp-${userId}@clerk.local` },
      });
    } catch (e) {
      logger.warn("auth: getAuthUser create failed (race condition)", { userId, error: e instanceof Error ? e.message : String(e) });
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });
    }
  }

  if (user) backfillEmailInBackground(user.id, userId, user.email);

  return user;
}
