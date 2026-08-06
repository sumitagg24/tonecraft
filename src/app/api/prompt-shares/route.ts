import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";

const api = withApiHandler({});

export const POST = api.POST(async (ctx) => {
  const { sharedWith, permission = "view", expiresAt } = await ctx.request.json();
  const result = await promptService.sharePrompt(ctx.params.id, ctx.user.id, {
    sharedWith,
    permission,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined
  });
  return ok(result);
});

// GET /api/prompt-shares - List all shares for user
export const GET_SHARED_WITH_ME = api.GET(async (ctx) => {
  const userId = ctx.user.id;
  const shares = await promptService.getSharedWithMe(userId);
  return ok(shares);
});

// DELETE /api/prompt-shares/[shareId]
export const DELETE = api.DELETE(async (ctx) => {
  const success = await promptService.revokeShare(ctx.params.id, ctx.user.id);
  if (!success) return notFound();
  return ok({ success: true });
});