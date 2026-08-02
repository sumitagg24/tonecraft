import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { messageService } from "@/services/MessageService";

const api = withApiHandler();

export const POST = api.POST(async (ctx) => {
  const { messageId } = ctx.params;
  try {
    const message = await messageService.regenerateMessage(messageId, ctx.user.id);
    return ok(message);
  } catch (error) {
    return fail(
      "REQUEST_FAILED",
      error instanceof Error ? error.message : "Failed to regenerate",
      400
    );
  }
});
