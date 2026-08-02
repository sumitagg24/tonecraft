import { ok, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";
import { z } from "zod";

const schema = z.object({
  content: z.string().min(1).max(10000),
  variables: z.record(z.string(), z.string().max(2000)).optional(),
});

const api = withApiHandler({ schema });

export const POST = api.POST(async (ctx, body) => {
  const { content, variables } = body as typeof schema._output;
  const rendered = promptService.renderTemplate(content, variables || {});
  return ok({ rendered });
});
