import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

const subFindUniqueMock: AnyMock = jest.fn();
const subUpsertMock: AnyMock = jest.fn();
const userFindUniqueMock: AnyMock = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { findUnique: subFindUniqueMock, upsert: subUpsertMock },
    user: { findUnique: userFindUniqueMock },
  },
}));

jest.mock("@/services/PlanService", () => ({
  planService: { invalidateCache: jest.fn(async () => {}) },
}));

jest.mock("@/services/AuditLogService", () => ({
  auditLogService: { record: jest.fn(async () => {}) },
}));

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/billing/dodoProducts", () => ({
  grantForProductId: jest.fn(
    (product_id: string) => {
      if (product_id === "pdt_basic") return "basic";
      if (product_id === "pdt_pro") return "pro";
      if (product_id === "pdt_enterprise") return "enterprise";
      return null;
    },
  ),
}));

const ORIGINAL_ENV: Record<string, string | undefined> = {};

function snapshotEnv() {
  ORIGINAL_ENV.DODO_PRODUCT_BASIC = process.env.DODO_PRODUCT_BASIC;
  ORIGINAL_ENV.DODO_PRODUCT_PRO = process.env.DODO_PRODUCT_PRO;
  ORIGINAL_ENV.DODO_PRODUCT_ADVANCED = process.env.DODO_PRODUCT_ADVANCED;
  ORIGINAL_ENV.DODO_PRODUCT_BASIC_ANNUAL = process.env.DODO_PRODUCT_BASIC_ANNUAL;
  ORIGINAL_ENV.DODO_PRODUCT_PRO_ANNUAL = process.env.DODO_PRODUCT_PRO_ANNUAL;
  ORIGINAL_ENV.DODO_PRODUCT_ADVANCED_ANNUAL = process.env.DODO_PRODUCT_ADVANCED_ANNUAL;
}

function restoreEnv() {
  process.env.DODO_PRODUCT_BASIC = ORIGINAL_ENV.DODO_PRODUCT_BASIC;
  process.env.DODO_PRODUCT_PRO = ORIGINAL_ENV.DODO_PRODUCT_PRO;
  process.env.DODO_PRODUCT_ADVANCED = ORIGINAL_ENV.DODO_PRODUCT_ADVANCED;
  process.env.DODO_PRODUCT_BASIC_ANNUAL = ORIGINAL_ENV.DODO_PRODUCT_BASIC_ANNUAL;
  process.env.DODO_PRODUCT_PRO_ANNUAL = ORIGINAL_ENV.DODO_PRODUCT_PRO_ANNUAL;
  process.env.DODO_PRODUCT_ADVANCED_ANNUAL = ORIGINAL_ENV.DODO_PRODUCT_ADVANCED_ANNUAL;
  for (const k of Object.keys(ORIGINAL_ENV)) delete ORIGINAL_ENV[k];
}

function configureEnv(productIds: Record<string, string>) {
  if (productIds.BASIC) process.env.DODO_PRODUCT_BASIC = productIds.BASIC;
  else delete process.env.DODO_PRODUCT_BASIC;
  if (productIds.PRO) process.env.DODO_PRODUCT_PRO = productIds.PRO;
  else delete process.env.DODO_PRODUCT_PRO;
  if (productIds.ADVANCED) process.env.DODO_PRODUCT_ADVANCED = productIds.ADVANCED;
  else delete process.env.DODO_PRODUCT_ADVANCED;
  if (productIds.BASIC_ANNUAL) process.env.DODO_PRODUCT_BASIC_ANNUAL = productIds.BASIC_ANNUAL;
  else delete process.env.DODO_PRODUCT_BASIC_ANNUAL;
  if (productIds.PRO_ANNUAL) process.env.DODO_PRODUCT_PRO_ANNUAL = productIds.PRO_ANNUAL;
  else delete process.env.DODO_PRODUCT_PRO_ANNUAL;
  if (productIds.ADVANCED_ANNUAL)
    process.env.DODO_PRODUCT_ADVANCED_ANNUAL = productIds.ADVANCED_ANNUAL;
  else delete process.env.DODO_PRODUCT_ADVANCED_ANNUAL;
}

function makePaymentEvent(overrides: {
  userId?: string;
  user_id?: string;
  plan?: string;
  productId?: string;
  status?: string;
  [key: string]: unknown;
} = {}): Record<string, unknown> {
  const metadata: Record<string, unknown> = { plan: "pro", userId: "user-1" };
  const { userId, user_id, plan, productId, ...dataOverrides } = overrides;
  if (userId !== undefined) metadata.userId = userId;
  if (user_id !== undefined) metadata.userId = user_id;
  if (plan !== undefined) metadata.plan = plan;
  const data: Record<string, unknown> = {
    payload_type: "Payment",
    payment_id: "pay_1",
    subscription_id: "sub_1",
    currency: "USD",
    customer: { customer_id: "cus_1", email: "customer@example.com", name: "Customer" },
    metadata,
    product_cart: productId ? [{ product_id: productId, quantity: 1 }] : [{ product_id: "pdt_pro", quantity: 1 }],
    status: "succeeded",
    total_amount: 500,
    created_at: "2026-09-01T10:00:00Z",
    ...dataOverrides,
  };
  if (productId === "") data.product_cart = [];
  return { type: "payment.succeeded", business_id: "biz_1", timestamp: "2026-09-01T10:00:00Z", data };
}

function makeSubscriptionEvent(
  type: string,
  overrides: {
    userId?: string;
    user_id?: string;
    plan?: string;
    productId?: string;
    product_id?: string;
    status?: string;
    cancelAtNextBillingDate?: boolean;
    cancel_at_next_billing_date?: boolean;
    previousBillingDate?: string;
    previous_billing_date?: string;
    nextBillingDate?: string;
    next_billing_date?: string;
    [key: string]: unknown;
  } = {},
): Record<string, unknown> {
  const metadata: Record<string, unknown> = { plan: "pro", userId: "user-1" };
  const {
    userId,
    user_id,
    plan,
    productId,
    product_id,
    status,
    cancelAtNextBillingDate,
    cancel_at_next_billing_date,
    previousBillingDate,
    previous_billing_date,
    nextBillingDate,
    next_billing_date,
    ...dataOverrides
  } = overrides;
  if (userId !== undefined) metadata.userId = userId;
  if (user_id !== undefined) metadata.userId = user_id;
  if (plan !== undefined) metadata.plan = plan;
  const data: Record<string, unknown> = {
    payload_type: "Subscription",
    subscription_id: "sub_1",
    status: "active",
    customer: { customer_id: "cus_1", email: "customer@example.com", name: "Customer" },
    metadata,
    product_id: productId ?? product_id ?? "pdt_pro",
    currency: "USD",
    cancel_at_next_billing_date:
      cancelAtNextBillingDate !== undefined
        ? cancelAtNextBillingDate
        : cancel_at_next_billing_date ?? false,
    created_at: "2026-09-01T10:00:00Z",
    previous_billing_date:
      previousBillingDate ?? previous_billing_date ?? "2026-09-01T10:00:00Z",
    next_billing_date:
      nextBillingDate ?? next_billing_date ?? "2026-10-01T10:00:00Z",
    ...dataOverrides,
  };
  return { type, business_id: "biz_1", timestamp: "2026-09-01T10:00:01Z", data };
}

// ---- Module under test (mocks are hoisted above this static import) ----

import * as helpers from "@/billing/dodoWebhook";
const {
  unwrap,
  asRecord,
  asString,
  firstRecord,
  toDate,
  eventIdOf,
  resolveProductId,
  planFromProductId,
  syncSubscriptionFromDodo,
} = helpers;

describe("Dodo webhook helpers (dodoWebhook.ts)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureEnv({
      BASIC: "pdt_basic",
      PRO: "pdt_pro",
      ADVANCED: "pdt_enterprise",
      BASIC_ANNUAL: "pdt_basic_yr",
      PRO_ANNUAL: "pdt_pro_yr",
      ADVANCED_ANNUAL: "pdt_enterprise_yr",
    });
  });

  afterEach(() => {
    restoreEnv();
  });

  // ---------- unwrap / asRecord / asString / firstRecord / toDate ----------

  describe("unwrap", () => {
    it("returns the inner data object when present", () => {
      expect(unwrap({ data: { subscription_id: "sub_1" } })).toEqual({
        subscription_id: "sub_1",
      });
    });

    it("returns the payload itself when there is no data", () => {
      expect(unwrap({ type: "payment.succeeded" })).toEqual({
        type: "payment.succeeded",
      });
    });

    it("returns the payload itself when data is not a plain object", () => {
      expect(unwrap({ data: [1, 2, 3] })).toEqual({ data: [1, 2, 3] });
      expect(unwrap({ data: "nope" })).toEqual({ data: "nope" });
    });

    it("returns the payload itself when data is null/undefined", () => {
      expect(unwrap({ data: null })).toEqual({ data: null });
      expect(unwrap({ data: undefined })).toEqual({ data: undefined });
    });
  });

  describe("asRecord", () => {
    it("returns the object when it is a plain record", () => {
      expect(asRecord({ a: 1 })).toEqual({ a: 1 });
    });

    it("returns null for arrays, primitives, null, undefined", () => {
      expect(asRecord([1, 2])).toBeNull();
      expect(asRecord("string")).toBeNull();
      expect(asRecord(42)).toBeNull();
      expect(asRecord(null)).toBeNull();
      expect(asRecord(undefined)).toBeNull();
    });
  });

  describe("asString", () => {
    it("returns the string value", () => {
      expect(asString("hello")).toBe("hello");
    });

    it("returns empty string for non-strings", () => {
      expect(asString(null)).toBe("");
      expect(asString(undefined)).toBe("");
      expect(asString(42)).toBe("");
      expect(asString(true)).toBe("");
      expect(asString({})).toBe("");
    });
  });

  describe("firstRecord", () => {
    it("returns the first plain-record argument", () => {
      expect(firstRecord(null, { a: 1 }, { b: 2 })).toEqual({ a: 1 });
    });

    it("skips non-records and continues", () => {
      expect(firstRecord("skip", null, undefined, { found: true })).toEqual({
        found: true,
      });
    });

    it("returns null when no argument is a plain record", () => {
      expect(firstRecord("a", 1, null, undefined)).toBeNull();
    });
  });

  describe("toDate", () => {
    it("returns a Date for an ISO string", () => {
      const d = toDate("2026-09-01T10:00:00Z");
      expect(d).toBeInstanceOf(Date);
      expect(d?.getTime()).toBe(Date.UTC(2026, 8, 1, 10, 0, 0));
    });

    it("returns null for non-strings", () => {
      expect(toDate(null)).toBeNull();
      expect(toDate(undefined)).toBeNull();
      expect(toDate(123)).toBeNull();
    });

    it("returns null for unparseable strings", () => {
      expect(toDate("not-a-date")).toBeNull();
      expect(toDate("")).toBeNull();
    });
  });
  describe("eventIdOf", () => {
    it("prefixes the event type with the payment_id", () => {
      expect(eventIdOf(makePaymentEvent({ payment_id: "pay_abc" }))).toBe(
        "payment.succeeded:pay_abc",
      );
    });

    it("uses the inner data's payment_id when the top-level is absent", () => {
      expect(
        eventIdOf({ type: "payment.succeeded", data: { payment_id: "pay_inner" } }),
      ).toBe("payment.succeeded:pay_inner");
    });

    it("falls back to subscription_id for subscription events", () => {
      expect(
        eventIdOf(makeSubscriptionEvent("subscription.active", { subscription_id: "sub_xyz" })),
      ).toBe("subscription.active:sub_xyz");
    });

    it("returns empty string when no resource id is available", () => {
      expect(eventIdOf({ type: "unknown" })).toBe("");
      expect(eventIdOf({ type: "payment.succeeded", data: {} })).toBe("");
    });

    it("empty string signals 'no dedupe key' to the webhook handler", () => {
      // Verifies the contract used by src/app/api/webhooks/dodo/route.ts:
      // a falsy eventIdOf result means "skip dedupe, treat as new".
      const payload = { type: "payment.succeeded", data: { product_cart: [] } };
      expect(eventIdOf(payload)).toBe("");
    });
  });

  describe("resolveProductId", () => {
    it("returns a flat product_id from subscription resources", () => {
      expect(
        resolveProductId({
          product_id: "pdt_pro",
          subscription_id: "sub_1",
        }),
      ).toBe("pdt_pro");
    });

    it("returns the nested product.product_id when no flat product_id", () => {
      expect(
        resolveProductId({
          subscription_id: "sub_1",
          product: { product_id: "pdt_basic" },
        }),
      ).toBe("pdt_basic");
    });

    it("falls back to the first product_cart entry for payment resources", () => {
      expect(
        resolveProductId({
          payment_id: "pay_1",
          subscription_id: "sub_1",
          product_cart: [
            { product_id: "pdt_pro", quantity: 1 },
            { product_id: "pdt_extras", quantity: 2 },
          ],
        }),
      ).toBe("pdt_pro");
    });

    it("returns empty string when no product id is reachable", () => {
      expect(
        resolveProductId({
          payment_id: "pay_1",
          subscription_id: "sub_1",
        }),
      ).toBe("");
    });

    it("skips empty/invalid cart entries", () => {
      expect(
        resolveProductId({
          product_cart: [
            { quantity: 1 },
            { product_id: "" },
            { product_id: "pdt_pro" },
          ],
        }),
      ).toBe("pdt_pro");
    });

    it("prefers flat product_id over product_cart", () => {
      expect(
        resolveProductId({
          product_id: "pdt_basic",
          product_cart: [{ product_id: "pdt_pro" }],
        }),
      ).toBe("pdt_basic");
    });
  });

  describe("planFromProductId", () => {
    it("maps known product ids to plan names", () => {
      expect(planFromProductId("pdt_basic")).toBe("basic");
      expect(planFromProductId("pdt_pro")).toBe("pro");
      expect(planFromProductId("pdt_enterprise")).toBe("enterprise");
    });

    it("returns empty string for unknown products", () => {
      expect(planFromProductId("pdt_unknown")).toBe("");
      expect(planFromProductId("")).toBe("");
    });
  });
});

// =========================================================================
// syncSubscriptionFromDodo integration tests
// =========================================================================

describe("syncSubscriptionFromDodo (full handler)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureEnv({
      BASIC: "pdt_basic",
      PRO: "pdt_pro",
      ADVANCED: "pdt_enterprise",
      BASIC_ANNUAL: "pdt_basic_yr",
      PRO_ANNUAL: "pdt_pro_yr",
      ADVANCED_ANNUAL: "pdt_enterprise_yr",
    });
  });

  afterEach(() => {
    restoreEnv();
  });

  it("creates a subscription row for a subscription.active event", async () => {
    subFindUniqueMock.mockResolvedValue(null);
    subUpsertMock.mockResolvedValue({
      id: "sub_1",
      user_id: "user-1",
      plan: "pro",
      status: "active",
    });

    const payload = makeSubscriptionEvent("subscription.active", {
      product_id: "pdt_pro",
      status: "active",
    });

    await syncSubscriptionFromDodo(payload, "active");

    expect(subFindUniqueMock).toHaveBeenCalledTimes(1);
    expect(subFindUniqueMock).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { plan: true },
    });

    expect(subUpsertMock).toHaveBeenCalledTimes(1);
    const upsertOp = subUpsertMock.mock.calls[0][0];
    expect(upsertOp.create).toMatchObject({
        userId: "user-1",
      paymentProvider: "dodo",
      providerSubscriptionId: "sub_1",
      providerCustomerId: "cus_1",
      providerPriceId: "pdt_pro",
      status: "active",
      plan: "pro",
      cancelAtPeriodEnd: false,
    });
    expect(upsertOp.update).toMatchObject({
      providerSubscriptionId: "sub_1",
      providerCustomerId: "cus_1",
      providerPriceId: "pdt_pro",
      status: "active",
      plan: "pro",
      cancelAtPeriodEnd: false,
      scheduledChange: null,
    });
  });

  it("upserts (updates) an existing subscription on renewal", async () => {
    subFindUniqueMock.mockResolvedValue({ plan: "pro" });
    subUpsertMock.mockResolvedValue({ plan: "pro", status: "active" });

    const payload = makeSubscriptionEvent("subscription.renewed", {
      product_id: "pdt_pro",
      status: "active",
    });

    await syncSubscriptionFromDodo(payload, "active");

    expect(subUpsertMock).toHaveBeenCalledTimes(1);
    const upsertOp = subUpsertMock.mock.calls[0][0];
    expect(upsertOp.update?.scheduledChange).toBeNull();
  });

  it("converts provider statuses via dodoStatusToLocal", async () => {
    subFindUniqueMock.mockResolvedValue(null);

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("subscription.on_hold", { status: "on_hold" }),
      "past_due",
    );

    expect(subUpsertMock).toHaveBeenCalledTimes(1);
    const upsertOp = subUpsertMock.mock.calls[0][0];
    expect(upsertOp.create?.status).toBe("past_due");
  });  it("cancels a subscription on subscription.cancelled", async () => {
    subFindUniqueMock.mockResolvedValue({ plan: "pro" });

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("subscription.cancelled", { status: "cancelled" }),
      "canceled",
    );

    const upsertOp = subUpsertMock.mock.calls[0][0];
    expect(upsertOp.create?.status).toBe("canceled");
    expect(upsertOp.create?.cancelAtPeriodEnd).toBe(true);
  });

  it("resolves the plan from the product_id via planFromProductId", async () => {
    subFindUniqueMock.mockResolvedValue(null);
    subUpsertMock.mockResolvedValue({ plan: "basic" });

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("subscription.active", {
        product_id: "pdt_basic",
        status: "active",
      }),
      "active",
    );

    const upsertOp = subUpsertMock.mock.calls[0][0];
    expect(upsertOp.create?.plan).toBe("basic");
    expect(upsertOp.create?.providerPriceId).toBe("pdt_basic");
  });

  it("falls back to existing.plan when the event has no product id", async () => {
    subFindUniqueMock.mockResolvedValue({ plan: "enterprise" });
    subUpsertMock.mockResolvedValue({ plan: "enterprise" });

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("subscription.active", { product_id: "" }),
      "active",
    );

    const upsertOp = subUpsertMock.mock.calls[0][0];
    expect(upsertOp.create?.plan).toBe("enterprise");
  });

  it("resolves userId from metadata.userId", async () => {
    subFindUniqueMock.mockResolvedValue(null);
    subUpsertMock.mockResolvedValue({ plan: "pro" });

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("subscription.active", {
        product_id: "pdt_pro",
        status: "active",
      }),
      "active",
    );

    expect(subUpsertMock).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: expect.any(Object),
      update: expect.any(Object),
    });
  });

  it("resolves userId by email when metadata.userId is absent", async () => {
    userFindUniqueMock.mockResolvedValue({ id: "user-by-email" });
    subUpsertMock.mockResolvedValue({ plan: "pro" });

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("subscription.active", {
        product_id: "pdt_pro",
        status: "active",
        user_id: "",
      }),
      "active",
    );

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { email: "customer@example.com" },
      select: { id: true },
    });

    const upsertOp = subUpsertMock.mock.calls[0][0];
    expect(upsertOp.create?.userId).toBe("user-by-email");
  });

  it("defers creation when the plan is unknown and createOnlyWhenPlanKnown is true", async () => {
    subFindUniqueMock.mockResolvedValue(null);

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("payment.succeeded", {
        product_id: "",
        status: "succeeded",
        user_id: "",
      }),
      "active",
      { createOnlyWhenPlanKnown: true },
    );

    expect(subUpsertMock).not.toHaveBeenCalled();
  });

  it("creates with plan=free when the plan is unknown and createOnlyWhenPlanKnown is false", async () => {
    subFindUniqueMock.mockResolvedValue(null);
    subUpsertMock.mockResolvedValue({ plan: "free" });

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("payment.succeeded", {
        product_id: "",
        status: "succeeded",
        user_id: "",
      }),
      "active",
      { createOnlyWhenPlanKnown: false },
    );

    const upsertOp = subUpsertMock.mock.calls[0][0];
    expect(upsertOp.create?.plan).toBe("free");
  });

  it("noops when userId cannot be resolved", async () => {
    userFindUniqueMock.mockResolvedValue(null);
    subUpsertMock.mockResolvedValue({ plan: "pro" });

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("subscription.active", {
        product_id: "pdt_pro",
        status: "active",
        user_id: "",
      }),
      "active",
    );

    expect(subUpsertMock).not.toHaveBeenCalled();
  });

  it("sets cancelAtPeriodEnd=true when Dodo signals cancel_at_next_billing_date", async () => {
    subFindUniqueMock.mockResolvedValue({
      plan: "pro",
      cancelAtPeriodEnd: false,
    });
    subUpsertMock.mockResolvedValue({ plan: "pro" });

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("subscription.active", {
        product_id: "pdt_pro",
        status: "active",
        cancel_at_next_billing_date: true,
      }),
      "active",
    );

    const upsertOp = subUpsertMock.mock.calls[0][0];
    expect(upsertOp.create?.cancelAtPeriodEnd).toBe(true);
    expect(upsertOp.update?.cancelAtPeriodEnd).toBe(true);
  });

  it("syncs billing-period windows (previous_billing_date/next_billing_date)", async () => {
    subFindUniqueMock.mockResolvedValue({ plan: "pro" });
    subUpsertMock.mockResolvedValue({ plan: "pro" });

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("subscription.active", {
        product_id: "pdt_pro",
        status: "active",
        previous_billing_date: "2026-09-01T10:00:00Z",
        next_billing_date: "2026-10-01T10:00:00Z",
      }),
      "active",
    );

    const upsertOp = subUpsertMock.mock.calls[0][0];
    expect(upsertOp.create?.currentPeriodStart).toEqual(
      new Date("2026-09-01T10:00:00Z"),
    );
    expect(upsertOp.create?.currentPeriodEnd).toEqual(
      new Date("2026-10-01T10:00:00Z"),
    );
  });

  it("invalidates the PlanService cache and records an audit event", async () => {
    const invalidateCache = (jest.requireMock("@/services/PlanService") as {
      planService: { invalidateCache: jest.Mock<() => Promise<void>> }
    }).planService.invalidateCache;
    const auditRecord = (jest.requireMock("@/services/AuditLogService") as {
      auditLogService: { record: jest.Mock<() => Promise<void>> }
    }).auditLogService.record;

    subFindUniqueMock.mockResolvedValue(null);
    subUpsertMock.mockResolvedValue({ plan: "pro" });

    await syncSubscriptionFromDodo(
      makeSubscriptionEvent("subscription.active", {
        product_id: "pdt_pro",
        status: "active",
      }),
      "active",
    );

    expect(invalidateCache).toHaveBeenCalledWith("user-1");
    expect(auditRecord).toHaveBeenCalledWith(
      "billing.subscribe",
      "subscription",
      expect.objectContaining({
        actorId: "user-1",
        resourceId: "sub_1",
        metadata: expect.objectContaining({
          plan: "pro",
          status: "active",
          provider: "dodo",
        }),
      }),
    );
  });
});
