import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Strict allowlist for color values (CSS hex)
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
// Allowlist for icon field — single emoji only
const ICON_RE = /^[\p{Emoji}\p{Emoji_Presentation}\s]{0,10}$/u;

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  systemPrompt: z.string().min(1).max(5000).optional(),
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exists = await prisma.persona.findUnique({ where: { id } });
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (exists.userId !== session.user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Guard: strip isDefault for user personas (never allow elevating to global default)
  const data = { ...parsed.data };
  if (data.isDefault === true) {
    delete data.isDefault;
  }

  const updated = await prisma.persona.update({
    where: { id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exists = await prisma.persona.findUnique({ where: { id } });
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const persona = await prisma.persona.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!persona) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  await prisma.persona.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
