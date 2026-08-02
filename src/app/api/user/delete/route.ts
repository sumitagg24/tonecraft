import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

const api = withApiHandler();

export const DELETE = api.DELETE(async (ctx) => {
  const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
  if (!user) return ok({ ok: true });

  // Delete all user data in order (foreign key constraints)
  await prisma.attachment.deleteMany({
    where: { message: { chat: { userId: user.id } } },
  });
  await prisma.message.deleteMany({
    where: { chat: { userId: user.id } },
  });
  await prisma.chat.deleteMany({ where: { userId: user.id } });
  await prisma.persona.deleteMany({ where: { userId: user.id } });
  await prisma.usage.deleteMany({ where: { userId: user.id } });
  await prisma.subscription.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  // Delete from Clerk
  const client = await clerkClient();
  await client.users.deleteUser(user.clerkId);

  return ok({ ok: true });
});
