import { ok, fail, notFound, forbidden, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { personaUpdateSchema } from "@/lib/validators";

const api = withApiHandler();

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id } = ctx.params;
  const exists = await prisma.persona.findUnique({ where: { id } });
  if (!exists) return notFound();
  if (exists.userId !== ctx.user.id) return forbidden();

  const parsed = personaUpdateSchema.safeParse(body);
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
