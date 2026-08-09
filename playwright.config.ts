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
  // CI also emits the HTML report (playwright-report/) so failed runs have a
  // browsable artifact; the workflow uploads it + test-results/ on failure.
  reporter: [["list"], ["html", { open: "never" }]],
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
      // Mobile/tablet-only responsive checks use touch/nav-drawer (or the md
      // header) paths that desktop doesn't exercise (see the mobile + tablet
      // projects below).
      testIgnore: [
        "**/mobile-responsive.spec.ts",
        "**/tablet-composer.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        // Fake media device so the voice-dictation test can exercise the real
        // MediaRecorder/getUserMedia path headlessly (microphone permission is
        // granted per-test via context.grantPermissions).
        launchOptions: {
          args: [
            "--use-fake-device-for-media-stream",
            "--use-fake-ui-for-media-stream",
          ],
        },
      },
    },
    // ── Mobile viewports ───────────────────────────────────────────────────
    // Responsive regression guards (see e2e/mobile-responsive.spec.ts). Both
    // run on the already-installed Chromium engine (the iOS project overrides
    // its default WebKit so no extra browser download is required). The
    // hydration + signed-in smoke specs run on these too, so any layout or
    // touch-only hydration regression fails CI automatically.
    //
    // chat-flow.spec.ts is intentionally excluded here: it drives AI-latency
    // flows and desktop hover/toolbar assumptions (e.g. the header "New
    // Workspace" button that is hidden below the sm breakpoint).
    {
      name: "mobile-android",
      testIgnore: ["**/chat-flow.spec.ts", "**/tablet-composer.spec.ts"],
      use: {
        ...devices["Pixel 7"],
      },
    },
    {
      name: "mobile-ios",
      testIgnore: ["**/chat-flow.spec.ts", "**/tablet-composer.spec.ts"],
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium", // iPhone viewport/touch flags on Chromium
        // Keep the iPhone form factor (390x844, DPR 3, touch) but send a
        // Chrome mobile UA: with the Safari UA, Clerk's dev-instance handshake
        // loops forever when the saved test session expires (net::
        // ERR_UNSAFE_REDIRECT) — an auth-env quirk, not a layout concern.
        userAgent:
          "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      },
    },
    // ── Tablet viewport (md range: 768–1023px) ────────────────────────────
    // Covers the breakpoint gap between phones (<768px) and desktop (>=1024px)
    // where the layout switches from the mobile nav drawer/bottom bar to the
    // desktop rail. At this width the shell renders the desktop layout (the
    // "Open navigation" button and bottom bar are md:hidden), so the
    // touch-specific mobile-responsive chat tests do NOT apply — this project
    // runs the layout guards instead: hydration smoke, signed-in smoke, the
    // auth-free overflow checks (responsive-overflow.spec.ts) at 834px, and
    // the md-range composer layout check (tablet-composer.spec.ts, signed-in).
    {
      name: "tablet-ios",
      testIgnore: ["**/chat-flow.spec.ts", "**/mobile-responsive.spec.ts"],
      use: {
        ...devices["iPad Pro 11"],
        browserName: "chromium", // iPad viewport/touch flags on Chromium
        // Same Clerk handshake rationale as mobile-ios: the default Safari UA
        // loops on expired dev sessions, so send a Chrome tablet UA.
        userAgent:
          "Mozilla/5.0 (Linux; Android 13; SM-X906C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    },
  ],
});
