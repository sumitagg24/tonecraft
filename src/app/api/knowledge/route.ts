import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { knowledgeService } from "@/services/KnowledgeService";
import { notificationService } from "@/services/NotificationService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const projectId = ctx.request.nextUrl.searchParams.get("projectId") || null;
  const files = await knowledgeService.list(ctx.user.id, projectId);
  return ok({ files });
});

export const POST = api.POST(async (ctx) => {
  // multipart/form-data — the wrapper skips JSON body parsing for this content type
  const formData = await ctx.request.formData();
  const file = formData.get("file") as File | null;
  const projectId = (formData.get("projectId") as string | null) || null;

  if (!file) return fail("BAD_REQUEST", "No file provided", 400);
  if (file.size > 25 * 1024 * 1024) {
    return fail("PAYLOAD_TOO_LARGE", "File too large (max 25MB)", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const created = await knowledgeService.create(ctx.user.id, file.name, buffer, projectId);
  void notificationService.create(
    ctx.user.id,
    "knowledge_indexed",
    "Document indexed",
    `"${created.name}" is ready to ground your responses.`,
    "/library"
  );
  return ok(created, 201);
});
