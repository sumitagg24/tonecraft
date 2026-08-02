import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  preferredLanguage: z.string().optional(),
  defaultTone: z.string().optional(),
});

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      preferredLanguage: true,
      defaultTone: true,
    },
  });
  if (!user) return notFound();

  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    preferredLanguage: user.preferredLanguage,
    defaultTone: user.defaultTone,
  });
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: { clerkId: true },
  });
  if (!user) return notFound();

  const { name, ...prefs } = parsed.data;

  // Update preferences in DB
  const updated = await prisma.user.update({
    where: { id: ctx.user.id },
    data: {
      ...prefs,
      ...(name ? { name } : {}),
    },
    select: { id: true, name: true, email: true, image: true, preferredLanguage: true, defaultTone: true },
  });

  // Sync name to Clerk if changed
  if (name) {
    const client = await clerkClient();
    const [firstName, ...rest] = name.split(" ");
    await client.users.updateUser(user.clerkId, {
      firstName,
      lastName: rest.join(" ") || undefined,
    });
  }

  return ok(updated);
});
