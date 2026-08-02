import { ok, fail, withApiHandler } from "@/lib/withApiHandler";

const api = withApiHandler();

export const POST = api.POST(async (_ctx, body) => {
  const { actions } = (body ?? {}) as { actions?: Array<{ key: string; type: string }> };

  if (!Array.isArray(actions)) {
    return fail("BAD_REQUEST", "actions must be an array", 400);
  }

  const results = [];
  for (const action of actions) {
    const { key, type } = action;
    results.push({ key, type, status: "processed" });
  }

  return ok({ results, syncedAt: new Date().toISOString() });
});

export const GET = api.GET(async () => {
  return ok({ pending: 0, lastSync: new Date().toISOString() });
});
