import { expect, type Page } from "@playwright/test";

/**
 * React hydration mismatches and related runtime failures are reported as
 * console errors in the browser. Keep this list in sync with React 18/19
 * messages:
 *  - "Hydration failed because the server rendered HTML didn't match the client"
 *  - "A tree hydrated but some attributes of the server rendered HTML didn't match"
 *  - "Text content did not match the server-rendered HTML"
 *  - "Expected server HTML to contain a matching <tag>"
 *  - "An error occurred during hydration so the server HTML was replaced"
 *  - Minified React error #418 / #419 / #423 / #425
 */
export const HYDRATION_PATTERNS: RegExp[] = [
  /hydrat/i,
  /did(?:n't| not) match/i,
  /A tree hydrated but/i,
  /Text content did not match/i,
  /Expected server HTML to contain/i,
  /Minified React error #4(18|19|23|25)/i,
  /cannot update during an existing state transition/i,
  /An error occurred during hydration/i,
];

export function isHydrationMessage(text: string): boolean {
  return HYDRATION_PATTERNS.some((pattern) => pattern.test(text));
}

/** Fail with a readable report if any hydration mismatch or console/page error occurred. */
export function assertNoClientErrors(errors: string[], context: string): void {
  const hydrationHits = errors.filter((e) => isHydrationMessage(e));
  expect(hydrationHits, `hydration mismatch on ${context}:\n${hydrationHits.join("\n")}`).toEqual([]);
  expect(errors, `console/page errors on ${context}:\n${errors.join("\n")}`).toEqual([]);
}

/** Collect every console.error + pageerror while the page settles. */
export function captureErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console.error] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
  return errors;
}

/** Navigate to `path` and assert it renders cleanly (200, real body, zero errors). */
export async function expectCleanPage(page: Page, path: string): Promise<void> {
  const errors = captureErrors(page);

  const response = await page.goto(path, { waitUntil: "networkidle" });
  expect(response?.status(), `${path} should respond 200`).toBe(200);

  // The shell must actually render — guards against blank/error pages that
  // would otherwise pass the console check.
  await expect(page.locator("body")).not.toBeEmpty();

  // Let client-side hydration + effects finish before asserting.
  await page.waitForTimeout(750);

  assertNoClientErrors(errors, path);
}
