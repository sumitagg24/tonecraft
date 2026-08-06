import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { agentService } from "@/services/AgentService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const agent = await agentService.get(ctx.params.id, ctx.user.id);
  if (!agent) return notFound();
  const runs = await agentService.runs(ctx.params.id, ctx.user.id);
  return ok(runs);
});
