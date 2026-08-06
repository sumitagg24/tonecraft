import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import { queueService } from "@/services/QueueService";

// --- Mocks -------------------------------------------------------------

jest.mock("@/lib/prisma", () => ({
  prisma: {
    queueItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncMock = jest.Mock<(...args: any[]) => Promise<any>>;

const queueItemCreate = prisma.queueItem.create as unknown as AsyncMock;
const queueItemFindMany = prisma.queueItem.findMany as unknown as AsyncMock;
const queueItemFindUnique = prisma.queueItem.findUnique as unknown as AsyncMock;
const queueItemUpdateMany = prisma.queueItem.updateMany as unknown as AsyncMock;
const queueItemUpdate = prisma.queueItem.update as unknown as AsyncMock;
const queueItemCount = prisma.queueItem.count as unknown as AsyncMock;

function dueItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "q-1",
    type: "email",
    payload: { to: "a@b.com", subject: "Hi" },
    attempts: 0,
    maxAttempts: 5,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  queueItemUpdateMany.mockResolvedValue({ count: 1 });
  queueItemUpdate.mockResolvedValue({});
  queueItemFindUnique.mockResolvedValue({ attempts: 0, maxAttempts: 5 });
});

// --- Tests -------------------------------------------------------------

describe("QueueService.enqueue", () => {
  it("creates a pending item with the payload and default attempts", async () => {
    queueItemCreate.mockResolvedValue({ id: "q-new" });

    const id = await queueService.enqueue("email", { to: "x@y.z" });

    expect(queueItemCreate).toHaveBeenCalledWith({
      data: {
        type: "email",
        payload: { to: "x@y.z" },
        availableAt: expect.any(Date),
        maxAttempts: 5,
      },
      select: { id: true },
    });
    expect(id).toBe("q-new");
  });

  it("honors custom availableAt and maxAttempts", async () => {
    queueItemCreate.mockResolvedValue({ id: "q-2" });
    const when = new Date(Date.now() + 60_000);

    await queueService.enqueue("embedding", { knowledgeFileId: "kf-1" }, { availableAt: when, maxAttempts: 3 });

    expect(queueItemCreate).toHaveBeenCalledWith({
      data: { type: "embedding", payload: { knowledgeFileId: "kf-1" }, availableAt: when, maxAttempts: 3 },
      select: { id: true },
    });
  });
});

describe("QueueService.claimDue", () => {
  it("claims due items atomically — only winning updateMany count is claimed", async () => {
    queueItemFindMany.mockResolvedValue([dueItem({ id: "q-1" }), dueItem({ id: "q-2" })]);
    // q-1 wins its claim, q-2 loses to a concurrent worker.
    queueItemUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const claimed = await queueService.claimDue(25);

    expect(claimed).toEqual([
      { id: "q-1", type: "email", payload: { to: "a@b.com", subject: "Hi" } },
    ]);
    // Each claim is scoped to the item id AND still-pending status.
    expect(queueItemUpdateMany).toHaveBeenNthCalledWith(1, {
      where: { id: "q-1", status: "pending" },
      data: { status: "processing", lockedAt: expect.any(Date) },
    });
    expect(queueItemUpdateMany).toHaveBeenNthCalledWith(2, {
      where: { id: "q-2", status: "pending" },
      data: { status: "processing", lockedAt: expect.any(Date) },
    });
  });

  it("queries only pending, due items capped at the batch limit", async () => {
    queueItemFindMany.mockResolvedValue([]);

    await queueService.claimDue(10);

    expect(queueItemFindMany).toHaveBeenCalledWith({
      where: { status: "pending", availableAt: { lte: expect.any(Date) } },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: { id: true, type: true, payload: true, attempts: true, maxAttempts: true },
    });
  });
});

describe("QueueService.fail", () => {
  it("retries with exponential backoff while attempts remain", async () => {
    queueItemFindUnique.mockResolvedValue({ attempts: 1, maxAttempts: 5 });

    const result = await queueService.fail("q-1", new Error("model timeout"));

    expect(result).toEqual({ status: "retry" });
    expect(queueItemUpdate).toHaveBeenCalledWith({
      where: { id: "q-1" },
      data: expect.objectContaining({
        status: "pending",
        attempts: 2,
        lastError: "model timeout",
        lockedAt: null,
        availableAt: expect.any(Date),
      }),
    });
    // Backoff doubles per attempt: attempt 2 → 1min * 2^(2-1) = 2min from now.
    const data = queueItemUpdate.mock.calls[0][0].data;
    const delayMs = data.availableAt.getTime() - Date.now();
    expect(delayMs).toBeGreaterThanOrEqual(120_000 - 5_000);
    expect(delayMs).toBeLessThanOrEqual(120_000 + 5_000);
  });

  it("dead-letters once maxAttempts is reached", async () => {
    queueItemFindUnique.mockResolvedValue({ attempts: 4, maxAttempts: 5 });

    const result = await queueService.fail("q-1", new Error("permanent failure"));

    expect(result).toEqual({ status: "dead" });
    expect(queueItemUpdate).toHaveBeenCalledWith({
      where: { id: "q-1" },
      data: expect.objectContaining({
        status: "failed",
        attempts: 5,
        lastError: "permanent failure",
        lockedAt: null,
        processedAt: expect.any(Date),
      }),
    });
  });
});

describe("QueueService.requeueStale", () => {
  it("unsticks processing items left by a crashed worker", async () => {
    queueItemUpdateMany.mockResolvedValue({ count: 3 });

    const requeued = await queueService.requeueStale();

    expect(requeued).toBe(3);
    expect(queueItemUpdateMany).toHaveBeenCalledWith({
      where: { status: "processing", lockedAt: { lt: expect.any(Date) } },
      data: { status: "pending", lockedAt: null },
    });
  });
});

describe("QueueService.complete & stats", () => {
  it("marks an item succeeded and clears lastError", async () => {
    await queueService.complete("q-1");

    expect(queueItemUpdate).toHaveBeenCalledWith({
      where: { id: "q-1" },
      data: { status: "succeeded", processedAt: expect.any(Date), lastError: null },
    });
  });

  it("counts by status", async () => {
    queueItemCount.mockResolvedValueOnce(5).mockResolvedValueOnce(2).mockResolvedValueOnce(40).mockResolvedValueOnce(1);

    const stats = await queueService.stats();

    expect(stats).toEqual({ pending: 5, processing: 2, succeeded: 40, failed: 1 });
  });
});
