import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  content: z.string().min(1).max(10000).optional(),
  category: z.string().max(50).optional(),
  variables: z.array(z.object({
    name: z.string().min(1).max(50),
    label: z.string().max(100).optional(),
    required: z.boolean().optional(),
    options: z.array(z.string().max(200)).max(50).optional(),
  })).max(50).optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  projectId: z.string().nullable().optional(),
});

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const prompt = await promptService.getPrompt(id, ctx.user.id);
  if (!prompt) return notFound();
  return ok(prompt);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id } = ctx.params;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const okResult = await promptService.updatePrompt(id, ctx.user.id, parsed.data);
  if (!okResult) return notFound();
  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id } = ctx.params;
  const okResult = await promptService.deletePrompt(id, ctx.user.id);
  if (!okResult) return notFound();
  return ok({ ok: true });
});
