import { ok, withApiHandler } from "@/lib/withApiHandler";
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

const api = withApiHandler({ schema: personaSchema });

export const GET = api.GET(async (ctx) => {
  const projectId = ctx.request.nextUrl.searchParams.get("projectId") || undefined;
  const personas = await prisma.persona.findMany({
    where: projectId ? { userId: ctx.user.id, projectId } : { userId: ctx.user.id },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
  });
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: { defaultPersonaId: true },
  });
  return ok({ personas, defaultPersonaId: user?.defaultPersonaId ?? null });
});

export const POST = api.POST(async (ctx, body) => {
  const { isDefault, ...data } = body as typeof personaSchema._output;
  const persona = await prisma.persona.create({
    data: {
      userId: ctx.user.id,
      ...data,
      platformDefaults: data.platformDefaults as Prisma.InputJsonValue | undefined,
    },
  });
  if (isDefault) {
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { defaultPersonaId: persona.id },
    });
  }
  return ok(persona, 201);
});
