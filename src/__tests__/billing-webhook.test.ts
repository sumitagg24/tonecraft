import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { POST } from "@/app/api/billing/webhook/route";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { auditLogService } from "@/services/AuditLogService";
import { planService } from "@/services/PlanService";

// --- Mocks -------------------------------------------------------------

jest.mock("@/billing/BillingService", () => ({
  billingService: {
    verifyWebhook: jest.fn(),
    handleWebhookEvent: jest.fn(),
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      upsert: jest.fn(),
    },
    webhookEvent: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("@/services/AuditLogService", () => ({
  auditLogService: {
    record: jest.fn(),
  },
}));

jest.mock("@/services/PlanService", () => ({
  planService: {
    invalidateCache: jest.fn(),
  },
}));

// Deterministic price ID so planFromPriceId maps the event to "pro".
jest.mock("@/lib/billing-prices", () => ({
  getPriceId: jest.fn(() => "pri_pro_test"),
}));

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncMock = jest.Mock<(...args: any[]) => Promise<any>>;

const subUpsert = prisma.subscription.upsert as unknown as AsyncMock;
const auditRecord = auditLogService.record as unknown as AsyncMock;
const invalidateCache = planService.invalidateCache as unknown as AsyncMock;

const verifyWebhook = billingService.verifyWebhook as unknown as AsyncMock;
const handleWebhookEvent = billingService.handleWebhookEvent as unknown as AsyncMock;

const PRICE_PRO = "pri_pro_test";

/** A plausible Paddle `transaction.completed` payload (camelCase, post-unmarshal). */
function makeRequest(): Request {
  return new Request("https://tonecraft.app/api/billing/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "paddle-signature": "ts=1755500000;h1=deadbeef",
    },
    body: JSON.stringify({
      eventType: "transaction.completed",
      data: {
        id: "sub_123",
        customerId: "cus_123",
        status: "active",
        items: [{ price: { id: PRICE_PRO } }],
        currentBillingPeriod: {
          startsAt: "2026-08-01T00:00:00Z",
          endsAt: "2026-09-01T00:00:00Z",
        },
        customData: { userId: "user-1" },
      },
    }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  verifyWebhook.mockResolvedValue({ eventType: "transaction.completed" });
  handleWebhookEvent.mockResolvedValue({
    type: "subscription.payment_succeeded",
    data: {
      id: "sub_123",
      customerId: "cus_123",
      status: "active",
      items: [{ price: { id: PRICE_PRO } }],
      currentBillingPeriod: {
        startsAt: "2026-08-01T00:00:00Z",
        endsAt: "2026-09-01T00:00:00Z",
      },
      customData: { userId: "user-1" },
    },
  });
  subUpsert.mockResolvedValue({ id: "sub_123", userId: "user-1", status: "active" });
});

// --- Webhook sync ------------------------------------------------------

describe("Paddle webhook — payment_succeeded", () => {
  it("activates the subscription for the webhook's user", async () => {
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });

    // The payment_succeeded handler flips the row to active (plan/periods are
    // carried by the subscription.created/updated events).
    expect(subUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        create: expect.objectContaining({
          userId: "user-1",
          paymentProvider: "paddle",
          status: "active",
        }),
        update: { status: "active" },
      })
    );

    expect(auditRecord).toHaveBeenCalledWith("billing.subscribe", "subscription", expect.any(Object));
    expect(invalidateCache).toHaveBeenCalledWith("user-1");
  });

  it("regression: payment_succeeded never records billing.unsubscribe", async () => {
    // The duplicate `subscription.payment_succeeded` case used to shadow the
    // real activation with a mislabeled "unsubscribe" audit entry. Guard
    // against re-introducing it.
    await POST(makeRequest());

    const actions = (auditRecord.mock.calls as Array<[string]>).map((c) => c[0]);
    expect(actions).toContain("billing.subscribe");
    expect(actions).not.toContain("billing.unsubscribe");
  });

  it("ignores unmapped events without touching the subscription", async () => {
    verifyWebhook.mockResolvedValue({ eventType: "product.created", data: { id: "pro_1" } });
    handleWebhookEvent.mockResolvedValue({ type: "ignored", data: { id: "pro_1" } });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(subUpsert).not.toHaveBeenCalled();
    expect(invalidateCache).not.toHaveBeenCalled();
  });
});
