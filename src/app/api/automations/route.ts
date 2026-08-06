import { ok, withApiHandler } from "@/lib/withApiHandler";
import { automationService } from "@/services/AutomationService";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  trigger: z.enum(["daily", "weekly", "custom"]).optional(),
  cron: z.string().max(60).nullable().optional(),
  prompt: z.string().min(1).max(10000),
  enabled: z.boolean().optional(),
});

const api = withApiHandler({ schema: createSchema });

export const GET = api.GET(async (ctx) => {
  const automations = await automationService.list(ctx.user.id);
  return ok(automations);
});

export const POST = api.POST(async (ctx, body) => {
  const data = body as typeof createSchema._output;
  const automation = await automationService.create(ctx.user.id, data);
  return ok(automation, 201);
});
