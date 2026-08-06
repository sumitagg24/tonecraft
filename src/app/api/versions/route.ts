import { ok, withApiHandler } from "@/lib/withApiHandler";
import { versionHistoryService } from "@/services/VersionHistoryService";
import { z } from "zod";

const createSchema = z.object({
  resourceType: z.string(),
  resourceId: z.string(),
  userId: z.string(),
  title: z.string().optional(),
content: z.record(z.string(), z.unknown()),
    diff: z.record(z.string(), z.unknown()).optional(),
  changeType: z.string(),
  changeSummary: z.string().optional(),
  isAuto: z.boolean().optional(),
  parentId: z.string().optional(),
});

const listSchema = z.object({
  resourceType: z.string(),
  resourceId: z.string(),
  page: z.coerce.number().min(1).optional(),
  perPage: z.coerce.number().min(1).max(100).optional(),
});

const api = withApiHandler();

export const POST = api.POST(async (ctx, body) => {
  const snapshot = await versionHistoryService.createSnapshot(body as Parameters<typeof versionHistoryService.createSnapshot>[0]);
  return ok(snapshot, 201);
});

export const GET = api.GET(async (ctx, body) => {
  const { resourceType, resourceId, page, perPage } = body as { resourceType: string; resourceId: string; page?: number; perPage?: number };
  const { items, total } = await versionHistoryService.listVersions(resourceType, resourceId, page, perPage);
  return ok({ items, total });
});