import { ok, fail, notFound, forbidden, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
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
  isFavorite: z.boolean().optional(),
  tone: z.string().max(50).optional(),
  temperature: z.number().int().min(0).max(100).optional(),
  emojiUsage: z.enum(["none", "subtle", "moderate", "heavy"]).optional(),
  writingStyle: z.string().max(50).optional(),
  platformDefaults: z.record(z.string(), z.string()).optional(),
  projectId: z.string().nullable().optional(),
});

const api = withApiHandler();

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id } = ctx.params;
  const exists = await prisma.persona.findUnique({ where: { id } });
  if (!exists) return notFound();
  if (exists.userId !== ctx.user.id) return forbidden();

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      parsed.error.issues.map((i) => i.message).join("; "),
      400
    );
  }

  const data = { ...parsed.data } as Record<string, unknown>;
  if (data.isDefault === true) {
    delete data.isDefault;
  }
  if (data.platformDefaults !== undefined) {
    data.platformDefaults = data.platformDefaults as Prisma.InputJsonValue;
  }
  if (data.projectId === null) {
    data.projectId = null;
  }

  const updated = await prisma.persona.update({
    where: { id },
    data: data as Prisma.PersonaUpdateInput,
  });
  return ok(updated);
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id } = ctx.params;
  const exists = await prisma.persona.findUnique({ where: { id } });
  if (!exists) return notFound();
  const persona = await prisma.persona.findFirst({
    where: { id, userId: ctx.user.id },
  });
  if (!persona) return forbidden();
  await prisma.persona.delete({ where: { id } });
  return ok({ ok: true });
});
