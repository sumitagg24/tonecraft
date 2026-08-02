import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { messageRepository } from "@/repositories/MessageRepository";
import { z } from "zod";

const schema = z.object({
  feedback: z.enum(["liked", "disliked"]).nullable(),
});

const api = withApiHandler({ schema });

export const POST = api.POST(async (ctx, body) => {
  const { messageId } = ctx.params;
  const { feedback } = body as typeof schema._output;

  const updated = await messageRepository.updateFeedback(messageId, feedback);
  if (!updated) return notFound();
  return ok({ ok: true });
});
