import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const ICON_RE = /^[\p{Emoji}\p{Emoji_Presentation}\s]{0,10}$/u;

const personaSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  systemPrompt: z.string().min(1).max(5000),
  icon: z.string().refine((v) => !v || ICON_RE.test(v), "Icon must be a single emoji or empty").optional(),
  color: z.string().refine((v) => !v || HEX_COLOR.test(v), "Color must be a valid hex color").optional(),
  isDefault: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  tone: z.string().max(50).optional(),
  temperature: z.number().int().min(0).max(100).optional(),
  emojiUsage: z.enum(["none", "subtle", "moderate", "heavy"]).optional(),
  writingStyle: z.string().max(50).optional(),
  platformDefaults: z.record(z.string(), z.string()).optional(),
  projectId: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
  const personas = await prisma.persona.findMany({
    where: projectId ? { userId: session.user.id, projectId } : { userId: session.user.id },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
  });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultPersonaId: true },
  });
  return NextResponse.json({ personas, defaultPersonaId: user?.defaultPersonaId ?? null });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = personaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { isDefault, ...data } = parsed.data;
  const persona = await prisma.persona.create({
    data: {
      userId: session.user.id,
      ...data,
      platformDefaults: data.platformDefaults as Prisma.InputJsonValue | undefined,
    },
  });
  if (isDefault) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { defaultPersonaId: persona.id },
    });
  }
  return NextResponse.json(persona, { status: 201 });
}
