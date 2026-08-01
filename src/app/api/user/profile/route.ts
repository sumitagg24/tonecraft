import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  preferredLanguage: z.string().optional(),
  defaultTone: z.string().optional(),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    preferredLanguage: user.preferredLanguage,
    defaultTone: user.defaultTone,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, ...prefs } = parsed.data;

  // Update preferences in DB
  const updated = await prisma.user.update({
    where: { id: user.id },
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

  return NextResponse.json(updated);
}
