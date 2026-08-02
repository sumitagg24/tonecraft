import { ok, withApiHandler } from "@/lib/withApiHandler";
import { toolService } from "@/services/ToolService";
import { z } from "zod";

const toolSchema = z.object({
  toolId: z.string(),
  input: z.string().min(1).max(10000),
  platform: z.string().optional(),
  language: z.string().optional(),
  tone: z.string().optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
  creativity: z.number().min(0).max(100).optional(),
  formality: z.enum(["casual", "neutral", "formal"]).optional(),
  audience: z.string().optional(),
  model: z.string().optional(),
});

const api = withApiHandler({ schema: toolSchema });

export const POST = api.POST(async (ctx, body) => {
  const { toolId, input, model, ...context } = body as typeof toolSchema._output;

  const result = await toolService.execute({
    toolId,
    input,
    ...context,
    modelId: model,
    userId: ctx.user.id,
  });

  return ok({
    content: result.content,
    model: result.model,
    provider: result.provider,
    tokens: result.tokens,
    latency: result.latency,
    metadata: result.metadata,
  });
});
