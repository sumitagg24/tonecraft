import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";

const api = withApiHandler({});

// GET /api/prompt-versions?promptId=... - List versions for a prompt
export const GET = api.GET(async (ctx) => {
  const promptId = ctx.request.nextUrl.searchParams.get("promptId");
  if (!promptId) return fail("VALIDATION_ERROR", "promptId query parameter is required");
  const versions = await promptService.listVersions(promptId);
  return ok(versions);
});

// GET /api/prompt-versions?promptId=...&version=... - Get a specific version
export const GET_VERSION = api.GET(async (ctx) => {
  const promptId = ctx.request.nextUrl.searchParams.get("promptId");
  const version = Number(ctx.request.nextUrl.searchParams.get("version"));
  if (!promptId || !version) return notFound();
  const versionData = await promptService.getVersion(promptId, version);
  if (!versionData) return notFound();
  return ok(versionData);
});

// DELETE /api/prompt-versions?promptId=...&version=... - Delete a specific version
export const DELETE = api.DELETE(async (ctx) => {
  const promptId = ctx.request.nextUrl.searchParams.get("promptId");
  const version = Number(ctx.request.nextUrl.searchParams.get("version"));
  if (!promptId || !version) return notFound();
  const success = await promptService.deletePromptVersion(promptId, version, ctx.user.id);
  if (!success) return notFound();
  return ok({ success: true });
});
