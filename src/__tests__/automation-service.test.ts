import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { Automation } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { automationService } from "@/services/AutomationService";
import { runAi } from "@/services/ai-assist";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";
import { notificationService } from "@/services/NotificationService";

// --- Mocks -------------------------------------------------------------

jest.mock("@/lib/prisma", () => ({
  prisma: {
    automation: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/services/ai-assist", () => ({
  runAi: jest.fn(),
}));

jest.mock("@/services/PlanService", () => ({
  planService: { getPlan: jest.fn() },
}));

jest.mock("@/lib/ratelimit", () => ({
  checkMessageLimit: jest.fn(),
}));

jest.mock("@/services/NotificationService", () => ({
  notificationService: { create: jest.fn() },
}));

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// --- Helpers -----------------------------------------------------------

// jest-mock 29 types mockResolvedValue via `ReturnType<T> extends PromiseLike
// ? U : never`; a bare `jest.Mock` has an `unknown` return type, which is NOT
// PromiseLike, so its value parameter collapses to `never`. Using an explicit
// Promise-returning function type keeps every mock value accepted.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncMock = jest.Mock<(...args: any[]) => Promise<any>>;

const findMany = prisma.automation.findMany as unknown as AsyncMock;
const updateMany = prisma.automation.updateMany as unknown as AsyncMock;
const update = prisma.automation.update as unknown as AsyncMock;
const getPlan = planService.getPlan as unknown as AsyncMock;
const checkLimit = checkMessageLimit as unknown as AsyncMock;
const notifyCreate = notificationService.create as unknown as AsyncMock;
const aiRun = runAi as unknown as AsyncMock;

function fixture(overrides: Partial<Automation> = {}): Automation {
  return {
    id: "auto-1",
    userId: "user-1",
    name: "Morning brief",
    trigger: "daily",
    cron: null,
    prompt: "Summarize yesterday's activity",
    enabled: true,
    running: false,
    nextRunAt: new Date(Date.now() - 60_000), // due
    lastRunAt: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const DUE_NOW = new Date("2026-08-06T10:00:00Z");

beforeEach(() => {
  jest.clearAllMocks();
  getPlan.mockResolvedValue({ tier: "free" });
  checkLimit.mockResolvedValue({ allowed: true, limit: 50, window: "day", remaining: 10 });
  aiRun.mockResolvedValue({
    content: "finished output",
    model: "gpt-4o",
    provider: "openai",
    tokens: 120,
    latency: 800,
  });
  notifyCreate.mockResolvedValue(true);
  updateMany.mockResolvedValue({ count: 1 });
  update.mockResolvedValue({});
});

// --- Tests -------------------------------------------------------------

describe("AutomationService.runDue", () => {
  it("claims due automations atomically and executes them (happy path)", async () => {
    findMany.mockResolvedValue([fixture()]);

    const result = await automationService.runDue(DUE_NOW);

    // Query targets enabled, not-running, due automations, capped at the batch limit.
    expect(findMany).toHaveBeenCalledWith({
      where: { enabled: true, running: false, nextRunAt: { lte: DUE_NOW } },
      orderBy: { nextRunAt: "asc" },
      take: 25,
    });

    // Atomic claim: only wins when the automation is still unclaimed.
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "auto-1", running: false, enabled: true, nextRunAt: { lte: DUE_NOW } },
      data: { running: true },
    });

    // Executed the AI task, rescheduled, cleared the lock, recorded lastRunAt.
    expect(aiRun).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "auto-1" },
        data: expect.objectContaining({
          lastRunAt: expect.any(Date),
          nextRunAt: expect.any(Date),
          running: false,
        }),
      })
    );

    // Completion notification fired.
    expect(notifyCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", type: "generation_finished" })
    );

    expect(result).toEqual(
      expect.objectContaining({
        scanned: 1,
        ran: 1,
        results: [{ id: "auto-1", name: "Morning brief", status: "completed", nextRunAt: expect.any(Date) }],
      })
    );
  });

  it("skips an automation whose claim was lost to a concurrent worker (claim race)", async () => {
    findMany.mockResolvedValue([fixture()]);
    updateMany.mockResolvedValue({ count: 0 }); // another worker claimed it first

    const result = await automationService.runDue(DUE_NOW);

    expect(aiRun).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(notifyCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ scanned: 1, ran: 0, results: [] });
  });

  it("executes exactly once when two workers run the same due automation concurrently", async () => {
    findMany.mockResolvedValue([fixture()]);
    // First claim wins, every later claim loses.
    updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValue({ count: 0 });

    const [first, second] = await Promise.all([
      automationService.runDue(DUE_NOW),
      automationService.runDue(DUE_NOW),
    ]);

    // Only the winning worker executed the AI task.
    expect(aiRun).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledTimes(2);

    const completed = [...first.results, ...second.results].filter((r) => r.status === "completed");
    expect(completed).toHaveLength(1);
    expect(notifyCreate).toHaveBeenCalledTimes(1);
  });

  it("reschedules without executing when the user is rate-limited", async () => {
    findMany.mockResolvedValue([fixture()]);
    checkLimit.mockResolvedValue({ allowed: false, limit: 10, window: "hour", remaining: 0 });

    const result = await automationService.runDue(DUE_NOW);

    // Never claimed, never executed.
    expect(updateMany).not.toHaveBeenCalled();
    expect(aiRun).not.toHaveBeenCalled();
    expect(notifyCreate).not.toHaveBeenCalled();

    // The guard ran with the user's plan tier, and the automation was
    // rescheduled to the next occurrence.
    expect(getPlan).toHaveBeenCalledWith("user-1");
    expect(checkLimit).toHaveBeenCalledWith("user-1", "free");
    expect(update).toHaveBeenCalledTimes(1);
    const call = update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "auto-1" });
    expect(call.data.nextRunAt).toBeInstanceOf(Date);
    expect(call.data.nextRunAt.getTime()).toBeGreaterThan(Date.now());

    // `ran` counts result entries (service semantics), which includes skipped
    // rate-limited automations — not just executions.
    expect(result).toEqual(
      expect.objectContaining({
        scanned: 1,
        ran: 1,
        results: [{ id: "auto-1", name: "Morning brief", status: "rate_limited", nextRunAt: expect.any(Date) }],
      })
    );
  });

  it("reschedules a failed run, clears the lock, and does NOT record lastRunAt", async () => {
    findMany.mockResolvedValue([fixture()]);
    aiRun.mockRejectedValue(new Error("model timeout"));

    const result = await automationService.runDue(DUE_NOW);

    // Lock cleared + rescheduled to the next occurrence.
    expect(update).toHaveBeenCalledTimes(1);
    const call = update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "auto-1" });
    expect(call.data).toEqual(
      expect.objectContaining({
        running: false,
        nextRunAt: expect.any(Date),
      })
    );
    // A failed run must not masquerade as a successful one.
    expect(call.data.lastRunAt).toBeUndefined();
    expect(call.data.nextRunAt.getTime()).toBeGreaterThan(Date.now());

    // Failure surfaced to the user as a system notification.
    expect(notifyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "system",
        title: expect.stringContaining("failed"),
        metadata: expect.objectContaining({ automationId: "auto-1" }),
      })
    );

    expect(result.results[0]).toEqual(
      expect.objectContaining({ id: "auto-1", status: "failed", nextRunAt: expect.any(Date) })
    );
  });

  it("does nothing when no automations are due", async () => {
    findMany.mockResolvedValue([]);

    const result = await automationService.runDue(DUE_NOW);

    expect(result).toEqual({ scanned: 0, ran: 0, results: [] });
    expect(updateMany).not.toHaveBeenCalled();
    expect(aiRun).not.toHaveBeenCalled();
  });
});
