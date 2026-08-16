import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

const mockFindUnique: AnyMock = jest.fn();
const mockUpsert: AnyMock = jest.fn();
const mockUpdateMany: AnyMock = jest.fn();

// `mock*`-prefixed variables are allowed inside jest.mock factories (hoisting).
jest.mock("@/lib/prisma", () => ({
  prisma: {
    webhookEvent: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
      updateMany: mockUpdateMany,
    },
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("claimWebhookEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 'new' for a first-time event and creates the claim", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({ id: "w1", processed: false });
    const { claimWebhookEvent } = await import("@/lib/webhook-dedupe");

    await expect(claimWebhookEvent("paddle", "evt_1", "subscription.created")).resolves.toBe("new");
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { provider_eventId: { provider: "paddle", eventId: "evt_1" } },
      create: { provider: "paddle", eventId: "evt_1", type: "subscription.created" },
      update: { type: "subscription.created" },
    });
  });

  it("returns 'duplicate' for an already-processed event (replay) and does not re-claim", async () => {
    mockFindUnique.mockResolvedValue({ processed: true });
    const { claimWebhookEvent } = await import("@/lib/webhook-dedupe");

    await expect(claimWebhookEvent("clerk", "msg_9", "user.created")).resolves.toBe("duplicate");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 'retry' when a previous attempt crashed mid-processing (processed=false)", async () => {
    mockFindUnique.mockResolvedValue({ processed: false });
    mockUpsert.mockResolvedValue({ id: "w1", processed: false });
    const { claimWebhookEvent } = await import("@/lib/webhook-dedupe");

    await expect(claimWebhookEvent("clerk", "msg_9", "user.updated")).resolves.toBe("retry");
    // Re-claim keeps processed=false so the handler re-runs.
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ type: "user.updated" }) })
    );
  });
});

describe("markWebhookProcessed", () => {
  it("flips the claim to processed with a timestamp", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });
    const { markWebhookProcessed } = await import("@/lib/webhook-dedupe");

    await markWebhookProcessed("paddle", "evt_1");
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { provider: "paddle", eventId: "evt_1" },
      data: { processed: true, processedAt: expect.any(Date) },
    });
  });
});
