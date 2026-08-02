import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const ICON_RE = /^[\p{Emoji}\p{Emoji_Presentation}\s]{0,10}$/u;

const personaSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  systemPrompt: z.string().min(1).max(5000),
  icon: z.string().refine(
    (v) => !v || ICON_RE.test(v),
    "Icon must be a single emoji or empty"
  ).optional(),
  color: z.string().refine(
    (v) => !v || HEX_COLOR.test(v),
    "Color must be a valid hex color (e.g. #6366F1)"
  ).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const personas = await prisma.persona.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(personas);
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
  const data = { ...parsed.data };
  if (data.isDefault === true) {
    delete data.isDefault;
  }
  const persona = await prisma.persona.create({
    data: { userId: session.user.id, ...data },
  });
  return NextResponse.json(persona, { status: 201 });
}
