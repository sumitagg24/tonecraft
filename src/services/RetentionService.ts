import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Daily retention cleanup for tables that grow without bound.
 *
 * Policy is deliberately conservative: operational/trace tables (queue jobs,
 * audit logs, activity, notifications, usage records, prompt history,
 * document operations) are pruned by default with long windows. User-content
 * tables (Message, MemoryItem) are DISABLED by default (0 days) — pruning
 * them deletes user data, so an operator must explicitly opt in via env.
 *
 * Every window is env-overridable: `RETENTION_DAYS_<TABLE>` (e.g.
 * RETENTION_DAYS_AUDITLOG=180). Set to 0 to disable that table.
 *
 * Deletes run in small id-batches so one table can never issue a single
 * unbounded DELETE that locks the database; a per-run row cap bounds the
 * total work a single cron tick does. Un-deleted rows are picked up by the
 * next daily run.
 *
 * Runs inside the daily cron worker (isolated job — one failure doesn't stop
 * the rest).
 */

const BATCH_SIZE = 1000;

function maxRowsPerRun(): number {
  const raw = process.env.RETENTION_MAX_ROWS_PER_RUN;
  if (raw === undefined || raw === "") return 100_000;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 100_000;
}

interface RetentionTable {
  table: "message" | "usageRecord" | "auditLog" | "activity" | "notification" | "queueItem" | "promptHistory" | "documentOperation" | "memoryItem";
  defaultDays: number;
  /** Only prune terminal queue states — never in-flight work. */
  queueStatuses?: string[];
}

const TABLES: RetentionTable[] = [
  { table: "queueItem", defaultDays: 30, queueStatuses: ["succeeded", "failed"] },
  { table: "auditLog", defaultDays: 365 },
  { table: "activity", defaultDays: 180 },
  { table: "notification", defaultDays: 365 },
  { table: "usageRecord", defaultDays: 365 },
  { table: "promptHistory", defaultDays: 365 },
  { table: "documentOperation", defaultDays: 180 },
  // User content — disabled unless explicitly configured.
  { table: "message", defaultDays: 0 },
  { table: "memoryItem", defaultDays: 0 },
];

function daysFor(table: string, fallback: number): number {
  const raw = process.env[`RETENTION_DAYS_${table.toUpperCase()}`];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Delete old rows in id-batches. Returns the total deleted. */
async function deleteInBatches(args: {
  selectIds: (cutoff: Date, take: number) => Promise<Array<{ id: string }>>;
  deleteIds: (ids: string[]) => Promise<{ count: number }>;
  cutoff: Date;
}): Promise<number> {
  const cap = maxRowsPerRun();
  let total = 0;
  for (;;) {
    const remaining = cap - total;
    if (remaining <= 0) break;
    const batch = await args.selectIds(args.cutoff, Math.min(BATCH_SIZE, remaining));
    if (batch.length === 0) break;
    const { count } = await args.deleteIds(batch.map((r) => r.id));
    total += count;
    if (batch.length < Math.min(BATCH_SIZE, remaining)) break;
  }
  return total;
}

export class RetentionService {
  /** Prune one table by age. Returns the number of deleted rows. */
  async prune(table: RetentionTable): Promise<number> {
    const days = daysFor(table.table, table.defaultDays);
    if (days <= 0) return 0;

    const cutoff = new Date(Date.now() - days * 86_400_000);

    switch (table.table) {
      case "queueItem": {
        const statuses = (table.queueStatuses ?? []) as never[];
        return deleteInBatches({
          cutoff,
          selectIds: (c, take) =>
            prisma.queueItem.findMany({
              where: { status: { in: statuses }, createdAt: { lt: c } },
              orderBy: { createdAt: "asc" },
              take,
              select: { id: true },
            }),
          deleteIds: (ids) => prisma.queueItem.deleteMany({ where: { id: { in: ids } } }),
        });
      }
      case "message": {
        return deleteInBatches({
          cutoff,
          selectIds: (c, take) =>
            prisma.message.findMany({ where: { createdAt: { lt: c } }, orderBy: { createdAt: "asc" }, take, select: { id: true } }),
          deleteIds: (ids) => prisma.message.deleteMany({ where: { id: { in: ids } } }),
        });
      }
      case "memoryItem": {
        return deleteInBatches({
          cutoff,
          selectIds: (c, take) =>
            prisma.memoryItem.findMany({ where: { createdAt: { lt: c } }, orderBy: { createdAt: "asc" }, take, select: { id: true } }),
          deleteIds: (ids) => prisma.memoryItem.deleteMany({ where: { id: { in: ids } } }),
        });
      }
      case "usageRecord": {
        return deleteInBatches({
          cutoff,
          selectIds: (c, take) =>
            prisma.usageRecord.findMany({ where: { createdAt: { lt: c } }, orderBy: { createdAt: "asc" }, take, select: { id: true } }),
          deleteIds: (ids) => prisma.usageRecord.deleteMany({ where: { id: { in: ids } } }),
        });
      }
      case "auditLog": {
        return deleteInBatches({
          cutoff,
          selectIds: (c, take) =>
            prisma.auditLog.findMany({ where: { createdAt: { lt: c } }, orderBy: { createdAt: "asc" }, take, select: { id: true } }),
          deleteIds: (ids) => prisma.auditLog.deleteMany({ where: { id: { in: ids } } }),
        });
      }
      case "activity": {
        return deleteInBatches({
          cutoff,
          selectIds: (c, take) =>
            prisma.activity.findMany({ where: { createdAt: { lt: c } }, orderBy: { createdAt: "asc" }, take, select: { id: true } }),
          deleteIds: (ids) => prisma.activity.deleteMany({ where: { id: { in: ids } } }),
        });
      }
      case "notification": {
        return deleteInBatches({
          cutoff,
          selectIds: (c, take) =>
            prisma.notification.findMany({ where: { createdAt: { lt: c } }, orderBy: { createdAt: "asc" }, take, select: { id: true } }),
          deleteIds: (ids) => prisma.notification.deleteMany({ where: { id: { in: ids } } }),
        });
      }
      case "promptHistory": {
        return deleteInBatches({
          cutoff,
          selectIds: (c, take) =>
            prisma.promptHistory.findMany({ where: { createdAt: { lt: c } }, orderBy: { createdAt: "asc" }, take, select: { id: true } }),
          deleteIds: (ids) => prisma.promptHistory.deleteMany({ where: { id: { in: ids } } }),
        });
      }
      case "documentOperation": {
        return deleteInBatches({
          cutoff,
          selectIds: (c, take) =>
            prisma.documentOperation.findMany({ where: { createdAt: { lt: c } }, orderBy: { createdAt: "asc" }, take, select: { id: true } }),
          deleteIds: (ids) => prisma.documentOperation.deleteMany({ where: { id: { in: ids } } }),
        });
      }
    }
  }

  /** Run all enabled retention windows; one table failing never stops the rest. */
  async runDaily(): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    for (const table of TABLES) {
      const days = daysFor(table.table, table.defaultDays);
      if (days <= 0) continue; // disabled — skip silently
      try {
        const deleted = await this.prune(table);
        results[table.table] = deleted;
      } catch (error) {
        logger.error(`[Retention] ${table.table} prune failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
        results[`${table.table}:error`] = 1;
      }
    }
    return results;
  }
}

export const retentionService = new RetentionService();
