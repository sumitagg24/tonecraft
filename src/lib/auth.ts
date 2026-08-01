import { auth as clerkAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export async function auth() {
  const { userId } = await clerkAuth();
  if (!userId) return null;

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
  } catch (e) {
    console.error(e);
    throw e;
  }

  // Lazy sync: webhook might not have fired yet
  if (!user) {
    try {
      user = await prisma.user.create({
        data: { clerkId: userId, email: `temp-${userId}@clerk.local` },
        select: { id: true },
      });
    } catch (e) {
      console.warn("auth: user create failed (race)", e instanceof Error ? e.message : e);
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });
    }
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
      console.warn("auth: getAuthUser create failed (race)", e instanceof Error ? e.message : e);
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });
    }
  }

  return user;
}
