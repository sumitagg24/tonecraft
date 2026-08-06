import { ok, withApiHandler } from "@/lib/withApiHandler";
import { documentService } from "@/services/DocumentService";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(200000).optional(),
  emoji: z.string().max(8).optional(),
});

const api = withApiHandler({ schema: createSchema });

export const GET = api.GET(async (ctx) => {
  const status = ctx.request.nextUrl.searchParams.get("status") ?? undefined;
  const documents = await documentService.list(ctx.user.id, status);
  return ok(documents);
});

export const POST = api.POST(async (ctx, body) => {
  const data = body as typeof createSchema._output;
  const document = await documentService.create(ctx.user.id, data);
  return ok(document, 201);
});
