import { ok, withApiHandler } from "@/lib/withApiHandler";
import { userRepository } from "@/repositories/UserRepository";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const prefs = await userRepository.getPreferences(ctx.user.id);
  return ok(prefs);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  await userRepository.updatePreferences(ctx.user.id, (body ?? {}) as Record<string, unknown>);
  return ok({ ok: true });
});
