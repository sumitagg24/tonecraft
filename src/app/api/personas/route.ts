import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { promptService } from "@/services/PromptService";
import { personaSchema, personaUpdateSchema } from "@/lib/validators";

const api = withApiHandler({});

export const GET = api.GET(async (ctx) => {
  const personas = await prisma.persona.findMany({
    where: { userId: ctx.user.id },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
  });
  return ok(personas);
});

export const GET_BY_ID = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const persona = await prisma.persona.findUnique({
    where: { id },
    include: { user: true, project: true }
  });
  
  if (!persona) return notFound();
  return ok(persona);
});

export const POST = api.POST(async (ctx, body) => {
  const parsed = personaSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map(i => i.message).join("; "), 400);
  }
  
  const prompt = await promptService.createPrompt(ctx.user.id, {
    title: parsed.data.name,
    description: parsed.data.description,
    content: parsed.data.systemPrompt,
    category: 'persona',
    variables: [],
    projectId: parsed.data.projectId ?? undefined,
  });
  
  return ok(prompt, 201);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id } = ctx.params;
  const parsed = personaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map(i => i.message).join("; "), 400);
  }
  
  await prisma.persona.update({
    where: { id, userId: ctx.user.id },
    data: parsed.data
  });
  
  return ok({ success: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id } = ctx.params;
  const exists = await prisma.persona.findUnique({ where: { id } });
  
  if (!exists || exists.userId !== ctx.user.id) {
    return fail("NOT_FOUND", "Persona not found or access denied", 403);
  }
  
  await prisma.persona.delete({ where: { id } });
  return ok({ success: true });
});