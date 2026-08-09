import { test, expect } from "@playwright/test";
import {
  captureErrors,
  assertNoClientErrors,
  expectNoHorizontalOverflow,
  isEnvironmentalError,
} from "./utils";

/**
 * Auth-free responsive guard: public pages must fit the viewport without any
 * horizontal scroll — on EVERY project (desktop, tablet, and both mobile
 * viewports). Overflow at the md/tablet range (768–1023px) is the classic
 * blind spot between the phone and desktop layouts, so this runs on the
 * tablet project too.
 *
 * No session needed — these are the same public paths hydration-smoke already
 * exercises.
 */
test("public pages fit the viewport (no horizontal overflow)", async ({ page }) => {
  const errors = captureErrors(page);
  for (const path of ["/", "/pricing", "/features", "/help"]) {
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status(), `${path} should respond 200`).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
    await page.waitForTimeout(300);
    await expectNoHorizontalOverflow(page, path);
  }
  assertNoClientErrors(errors.filter((e) => !isEnvironmentalError(e)), "public pages");
});
