import { ok, withApiHandler } from "@/lib/withApiHandler";
import { messageRepository } from "@/repositories/MessageRepository";
import { z } from "zod";

const schema = z.object({ content: z.string().min(1) });

const api = withApiHandler({ schema });

export const PATCH = api.PATCH(async (ctx, body) => {
  const { messageId } = ctx.params;
  const { content } = body as typeof schema._output;

  await messageRepository.update(messageId, {
    content,
    isEdited: true,
    editedAt: new Date(),
  });

  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { messageId } = ctx.params;

  await messageRepository.findById(messageId);
  await (await import("@/lib/prisma")).prisma.message.delete({ where: { id: messageId } });
  return ok({ ok: true });
});
