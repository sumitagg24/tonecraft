import { ok, withApiHandler } from "@/lib/withApiHandler";
import { taskService } from "@/services/TaskService";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

const api = withApiHandler({ schema: createSchema });

export const GET = api.GET(async (ctx) => {
  const status = ctx.request.nextUrl.searchParams.get("status") as "todo" | "in_progress" | "done" | null;
  const tasks = await taskService.list(ctx.user.id, status ?? undefined);
  return ok(tasks);
});

export const POST = api.POST(async (ctx, body) => {
  const data = body as typeof createSchema._output;
  const task = await taskService.create(ctx.user.id, data);
  return ok(task, 201);
});
