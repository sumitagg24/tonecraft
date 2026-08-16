import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

const tables = [
  "queueItem",
  "auditLog",
  "activity",
  "notification",
  "usageRecord",
  "promptHistory",
  "documentOperation",
  "message",
  "memoryItem",
];

/** Next batches the shared findMany returns; [[]] = always empty. */
let nextBatches: unknown[][] = [[]];

const mockFindMany: AnyMock = jest.fn(async () => {
  if (nextBatches.length > 1) return nextBatches.shift();
  return nextBatches[0] ?? [];
});
const mockDeleteMany: AnyMock = jest.fn(async (args: { where?: { id?: { in?: unknown[] } } }) => ({
  count: args?.where?.id?.in?.length ?? 0,
}));

jest.mock("@/lib/prisma", () => {
  const mock: Record<string, unknown> = {};
  for (const t of tables) mock[t] = { findMany: mockFindMany, deleteMany: mockDeleteMany };
  return { prisma: mock };
});

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const REAL_ENV: Record<string, string | undefined> = {};
for (const t of tables) {
  REAL_ENV[`RETENTION_DAYS_${t.toUpperCase()}`] = process.env[`RETENTION_DAYS_${t.toUpperCase()}`];
}
REAL_ENV.RETENTION_MAX_ROWS_PER_RUN = process.env.RETENTION_MAX_ROWS_PER_RUN;

function clearRetentionEnv() {
  for (const t of tables) {
    delete process.env[`RETENTION_DAYS_${t.toUpperCase()}`];
  }
  delete process.env.RETENTION_MAX_ROWS_PER_RUN;
}

async function loadService() {
  jest.resetModules();
  return import("@/services/RetentionService");
}

describe("RetentionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextBatches = [[]];
    clearRetentionEnv();
  });

  afterEach(() => {
    for (const t of tables) {
      const key = `RETENTION_DAYS_${t.toUpperCase()}`;
      if (REAL_ENV[key] === undefined) delete process.env[key];
      else process.env[key] = REAL_ENV[key];
    }
    if (REAL_ENV.RETENTION_MAX_ROWS_PER_RUN === undefined) delete process.env.RETENTION_MAX_ROWS_PER_RUN;
    else process.env.RETENTION_MAX_ROWS_PER_RUN = REAL_ENV.RETENTION_MAX_ROWS_PER_RUN;
  });

  it("prunes operational tables with default windows, deleting in id batches", async () => {
    nextBatches = [[{ id: "a" }, { id: "b" }, { id: "c" }], []];
    const { retentionService } = await loadService();
    const deleted = await retentionService.prune({ table: "auditLog", defaultDays: 365 });

    expect(deleted).toBe(3);
    // Deletes are id-scoped batches — never an unbounded deleteMany.
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { id: { in: ["a", "b", "c"] } } });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "asc" }, take: 1000 })
    );
  });

  it("only prunes terminal queue states (never in-flight work)", async () => {
    nextBatches = [[{ id: "a" }, { id: "b" }, { id: "c" }], []];
    const { retentionService } = await loadService();
    await retentionService.prune({
      table: "queueItem",
      defaultDays: 30,
      queueStatuses: ["succeeded", "failed"],
    });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: { in: ["succeeded", "failed"] } }) })
    );
  });

  it("skips tables with a 0-day window (user content disabled by default)", async () => {
    const { retentionService } = await loadService();
    const deleted = await retentionService.prune({ table: "message", defaultDays: 0 });
    expect(deleted).toBe(0);
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });

  it("honors env overrides (RETENTION_DAYS_*)", async () => {
    process.env.RETENTION_DAYS_AUDITLOG = "90";
    nextBatches = [[{ id: "a" }, { id: "b" }, { id: "c" }], []];
    const { retentionService } = await loadService();
    await retentionService.prune({ table: "auditLog", defaultDays: 365 });
    const where = mockFindMany.mock.calls[0][0].where as { createdAt: { lt: Date } };
    const expected = new Date(Date.now() - 90 * 86_400_000);
    expect(Math.abs(where.createdAt.lt.getTime() - expected.getTime())).toBeLessThan(5_000);
  });

  it("stops deleting once the per-run row cap is reached", async () => {
    process.env.RETENTION_MAX_ROWS_PER_RUN = "500";
    nextBatches = [Array.from({ length: 500 }, (_, i) => ({ id: `r${i}` })), []];
    const { retentionService } = await loadService();
    const deleted = await retentionService.prune({ table: "auditLog", defaultDays: 365 });
    expect(deleted).toBe(500);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 500 }));
  });

  it("runDaily runs every enabled table and skips disabled user-content tables", async () => {
    const { retentionService } = await loadService();
    const results = await retentionService.runDaily();
    const enabled = ["queueItem", "auditLog", "activity", "notification", "usageRecord", "promptHistory", "documentOperation"];
    for (const t of enabled) {
      expect(typeof results[t]).toBe("number");
    }
    expect(results.message).toBeUndefined();
    expect(results.memoryItem).toBeUndefined();
  });
});
