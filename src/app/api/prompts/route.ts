import { ok, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";
import { z } from "zod";

const variableSchema = z.object({
  name: z.string().min(1).max(50),
  label: z.string().max(100).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string().max(200)).max(50).optional(),
});

const promptSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  content: z.string().min(1).max(10000),
  category: z.string().max(50).optional(),
  variables: z.array(variableSchema).max(50).optional(),
  projectId: z.string().optional(),
});

const api = withApiHandler({ schema: promptSchema });

export const GET = api.GET(async (ctx) => {
  const projectId = ctx.request.nextUrl.searchParams.get("projectId") || undefined;
  const prompts = await promptService.listPrompts(ctx.user.id, projectId);
  const categories = await promptService.listCategories(ctx.user.id);
  return ok({ prompts, categories });
});

export const POST = api.POST(async (ctx, body) => {
  const prompt = await promptService.createPrompt(ctx.user.id, body as typeof promptSchema._output);
  return ok(prompt, 201);
});
