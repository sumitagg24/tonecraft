import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export async function DELETE() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ success: true });
}
