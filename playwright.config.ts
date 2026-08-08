import { defineConfig, devices } from "@playwright/test";

/**
 * Hydration & console-error smoke test.
 *
 * Default mode boots the PRODUCTION server (`next start`) — requires a prior
 * `npm run build` (the `smoke` script does build + test). Set `E2E_DEV=1` to
 * run against `next dev` instead (loads .env.local and surfaces the most
 * hydration warnings; great for iterative local checks).
 *
 * Local runs pick up Clerk keys from .env.local automatically. CI passes them
 * through repo secrets (see .github/workflows/ci.yml).
 */
const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["list"]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 45_000,
  },
  webServer: {
    command:
      process.env.E2E_DEV === "1"
        ? `npm run dev -- -p ${PORT}`
        : `npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
