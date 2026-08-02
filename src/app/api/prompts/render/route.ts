import { ok, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";
import { promptRenderSchema } from "@/lib/validators";

const api = withApiHandler({ schema: promptRenderSchema });

export const POST = api.POST(async (ctx, body) => {
  const { content, variables } = body as typeof promptRenderSchema._output;
  const rendered = promptService.renderTemplate(content, variables || {});
  return ok({ rendered });
});
