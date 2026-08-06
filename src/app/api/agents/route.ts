import { ok, withApiHandler } from "@/lib/withApiHandler";
import { agentService } from "@/services/AgentService";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  role: z.string().max(4000).optional(),
  icon: z.string().max(8).optional(),
  color: z.string().max(20).optional(),
});

const api = withApiHandler({ schema: createSchema });

export const GET = api.GET(async (ctx) => {
  const agents = await agentService.list(ctx.user.id);
  return ok(agents);
});

export const POST = api.POST(async (ctx, body) => {
  const data = body as typeof createSchema._output;
  const agent = await agentService.create(ctx.user.id, data);
  return ok(agent, 201);
});
