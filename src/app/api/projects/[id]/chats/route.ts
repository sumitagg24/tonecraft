import { ok, withApiHandler } from "@/lib/withApiHandler";
import { projectService } from "@/services/ProjectService";
import { z } from "zod";

const chatSchema = z.object({
  title: z.string().max(200).optional(),
});

const api = withApiHandler({ schema: chatSchema });

export const POST = api.POST(async (ctx, body) => {
  const { id } = ctx.params;
  const chat = await projectService.createProjectChat(id, ctx.user.id, body as typeof chatSchema._output);
  return ok(chat, 201);
});
