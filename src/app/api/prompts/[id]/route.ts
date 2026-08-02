import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";
import { promptUpdateSchema } from "@/lib/validators";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const prompt = await promptService.getPrompt(id, ctx.user.id);
  if (!prompt) return notFound();
  return ok(prompt);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id } = ctx.params;
  const parsed = promptUpdateSchema.safeParse(body);
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
