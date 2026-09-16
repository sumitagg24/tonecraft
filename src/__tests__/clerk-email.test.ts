import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<(...args: any[]) => any>;

const getUserMock: AnyMock = jest.fn();
const userUpdateMock: AnyMock = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  clerkClient: jest.fn(async () => ({ users: { getUser: getUserMock } })),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: { user: { update: userUpdateMock } },
}));

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import {
  isPlaceholderEmail,
  fetchClerkPrimaryEmail,
  ensureRealEmail,
} from "@/lib/clerk-email";

describe("clerk-email placeholder guard", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    userUpdateMock.mockReset();
    userUpdateMock.mockResolvedValue({});
  });

  it("flags empty and @clerk.local addresses, accepts real ones", () => {
    expect(isPlaceholderEmail("")).toBe(true);
    expect(isPlaceholderEmail(null)).toBe(true);
    expect(isPlaceholderEmail(undefined)).toBe(true);
    expect(isPlaceholderEmail("temp-user_abc@clerk.local")).toBe(true);
    expect(isPlaceholderEmail("mingwsumit@gmail.com")).toBe(false);
  });

  it("prefers the primary email address from Clerk", async () => {
    getUserMock.mockResolvedValue({
      primaryEmailAddressId: "e2",
      emailAddresses: [
        { id: "e1", emailAddress: "old@example.com" },
        { id: "e2", emailAddress: "new@example.com" },
      ],
    });
    await expect(fetchClerkPrimaryEmail("clerk_1")).resolves.toBe("new@example.com");
  });

  it("returns null when Clerk lookup fails", async () => {
    getUserMock.mockRejectedValue(new Error("clerk down"));
    await expect(fetchClerkPrimaryEmail("clerk_1")).resolves.toBeNull();
  });

  it("backfills placeholder rows and returns the real email", async () => {
    getUserMock.mockResolvedValue({
      primaryEmailAddressId: "e1",
      emailAddresses: [{ id: "e1", emailAddress: "real@example.com" }],
    });
    await expect(
      ensureRealEmail("db_1", "clerk_1", "temp-clerk_1@clerk.local"),
    ).resolves.toBe("real@example.com");
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "db_1" },
      data: { email: "real@example.com" },
    });
  });

  it("never calls Clerk for rows that already have a real email", async () => {
    await expect(
      ensureRealEmail("db_1", "clerk_1", "real@example.com"),
    ).resolves.toBe("real@example.com");
    expect(getUserMock).not.toHaveBeenCalled();
    expect(userUpdateMock).not.toHaveBeenCalled();
  });
});
