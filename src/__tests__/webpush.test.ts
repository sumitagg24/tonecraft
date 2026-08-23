import { describe, it, expect, afterEach, jest } from "@jest/globals";

// The module dynamic-imports web-push only when configured, so we can mock
// it after setting env vars. Keep NODE_ENV per-test.
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_KEYS = {
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
};

// process.env.NODE_ENV is typed read-only on NodeJS.ProcessEnv; runtime
// assignment still works, so route it through a mutable view.
const envMutable = process.env as Record<string, string | undefined>;
function setNodeEnv(value: string) {
  envMutable.NODE_ENV = value;
}

afterEach(() => {
  setNodeEnv(ORIGINAL_NODE_ENV ?? "test");
  for (const [k, v] of Object.entries(ORIGINAL_KEYS)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  jest.resetModules();
});

const SUB = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
  keys: { p256dh: "p256", auth: "auth" },
};

async function load() {
  return import("@/lib/webpush");
}

describe("sendWebPush — VAPID config contract", () => {
  it("skips with a warning in dev when VAPID keys are missing", async () => {
    setNodeEnv("development");
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;

    const { sendWebPush } = await load();
    await expect(sendWebPush(SUB, { title: "hi" })).resolves.toBeNull();
  });

  it("throws (fail closed) in production when VAPID keys are missing", async () => {
    setNodeEnv("production");
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;

    const { sendWebPush } = await load();
    await expect(sendWebPush(SUB, { title: "hi" })).rejects.toThrow(/VAPID/);
  });

  it("delivers when VAPID is configured (web-push mocked)", async () => {
    setNodeEnv("production");
    process.env.VAPID_PUBLIC_KEY = "public-key";
    process.env.VAPID_PRIVATE_KEY = "private-key";
    process.env.VAPID_SUBJECT = "mailto:feedback@tonecraft.app";

    // Mirror the real CJS shape: the API hangs off the default export.
    jest.mock("web-push", () => ({
      __esModule: true,
      default: {
        setVapidDetails: jest.fn(),
        sendNotification: jest.fn(async () => ({})),
      },
    }));

    const { sendWebPush } = await load();
    await sendWebPush(SUB, { title: "ToneCraft", body: "Body", url: "/notifications" });

    const mod = jest.requireMock("web-push") as {
      default: { setVapidDetails: jest.Mock; sendNotification: jest.Mock };
    };
    const sendNotification = mod.default.sendNotification;
    expect(sendNotification).toHaveBeenCalledTimes(1);
    const call = sendNotification.mock.calls[0];
    const target = call?.[0] as { endpoint: string } | undefined;
    const payload = String(call?.[1]);
    expect(target?.endpoint).toBe(SUB.endpoint);
    expect(JSON.parse(payload)).toEqual({ title: "ToneCraft", body: "Body", url: "/notifications" });
  });

  it("returns null when getVapidPublicKey is unset", async () => {
    delete process.env.VAPID_PUBLIC_KEY;
    const { getVapidPublicKey } = await load();
    expect(getVapidPublicKey()).toBeNull();
  });

  it("returns the public key when configured", async () => {
    process.env.VAPID_PUBLIC_KEY = "pk_123";
    const { getVapidPublicKey } = await load();
    expect(getVapidPublicKey()).toBe("pk_123");
  });
});
