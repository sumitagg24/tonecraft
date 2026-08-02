import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { messageRepository } from "@/repositories/MessageRepository";
import { z } from "zod";

const schema = z.object({ content: z.string().min(1) });

const api = withApiHandler({ schema });

// All mutations are ownership-scoped via `chat.userId` (audit 12 P0.1 — message IDOR).
export const PATCH = api.PATCH(async (ctx, body) => {
  const { messageId } = ctx.params;
  const { content } = body as typeof schema._output;

  const updated = await messageRepository.updateForUser(messageId, ctx.user.id, {
    content,
    isEdited: true,
    editedAt: new Date(),
  });
  if (!updated) return notFound();

  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { messageId } = ctx.params;

  const deleted = await messageRepository.deleteForUser(messageId, ctx.user.id);
  if (!deleted) return notFound();

  return ok({ ok: true });
});
