import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

const mockUserFindUnique: AnyMock = jest.fn();

// The factory references mockUserFindUnique (a `mock*`-prefixed variable), so
// it survives jest.resetModules() and every module reload shares the same fn.
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const REAL_ADMIN_EMAILS = process.env.ADMIN_EMAILS;

async function loadAdmin() {
  jest.resetModules();
  // isGlobalAdmin reads ADMIN_EMAILS at module top-level, so reload per test.
  return import("@/lib/admin");
}

describe("isGlobalAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (REAL_ADMIN_EMAILS === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = REAL_ADMIN_EMAILS;
  });

  afterEach(() => {
    if (REAL_ADMIN_EMAILS === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = REAL_ADMIN_EMAILS;
  });

  it("fails closed when ADMIN_EMAILS is unset — nobody is an admin", async () => {
    delete process.env.ADMIN_EMAILS;
    const { isGlobalAdmin } = await loadAdmin();
    await expect(isGlobalAdmin("any-user")).resolves.toBe(false);
  });

  it("fails closed when ADMIN_EMAILS is empty", async () => {
    process.env.ADMIN_EMAILS = "";
    const { isGlobalAdmin } = await loadAdmin();
    await expect(isGlobalAdmin("any-user")).resolves.toBe(false);
  });

  it("grants access only to matching emails (case-insensitive, trimmed)", async () => {
    process.env.ADMIN_EMAILS = "ops@tonecraft.app, support@tonecraft.app ";
    mockUserFindUnique.mockResolvedValue({ email: "SUPPORT@tonecraft.app" });
    const { isGlobalAdmin } = await loadAdmin();
    await expect(isGlobalAdmin("user-1")).resolves.toBe(true);
  });

  it("denies emails not on the list", async () => {
    process.env.ADMIN_EMAILS = "ops@tonecraft.app";
    mockUserFindUnique.mockResolvedValue({ email: "attacker@evil.com" });
    const { isGlobalAdmin } = await loadAdmin();
    await expect(isGlobalAdmin("user-1")).resolves.toBe(false);
  });

  it("denies lazy-synced temp emails (they never match the real admin list)", async () => {
    process.env.ADMIN_EMAILS = "ops@tonecraft.app";
    mockUserFindUnique.mockResolvedValue({ email: "temp-abc@clerk.local" });
    const { isGlobalAdmin } = await loadAdmin();
    // A user whose row is a lazy-sync placeholder can never be an admin until
    // the Clerk webhook fills in their real verified email.
    await expect(isGlobalAdmin("user-1")).resolves.toBe(false);
  });

  it("denies when the user row is missing", async () => {
    process.env.ADMIN_EMAILS = "ops@tonecraft.app";
    mockUserFindUnique.mockResolvedValue(null);
    const { isGlobalAdmin } = await loadAdmin();
    await expect(isGlobalAdmin("ghost-user")).resolves.toBe(false);
  });
});
