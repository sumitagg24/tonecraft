import { prisma } from "@/lib/prisma";
import { ok, withApiHandler } from "@/lib/withApiHandler";
import { z } from "zod";

/**
 * Removes a stored push subscription. Ownership-scoped: only the session
 * user's own endpoints can be deleted (no cross-user endpoint deletion).
 */
const schema = z.object({
  endpoint: z.string().url().max(2048),
});

const api = withApiHandler({ schema });

export const DELETE = api.DELETE(async (ctx, body) => {
  const { endpoint } = body as z.infer<typeof schema>;
  const result = await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: ctx.user.id },
  });
  return ok({ deleted: result.count });
});
