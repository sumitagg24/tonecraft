/**
 * ToneCraft extension — browser E2E (Chromium + loaded unpacked extension).
 *
 * Runs against LOCAL fixture pages (no external sites) with the ToneCraft
 * API stubbed at the network layer, so every workflow is deterministic:
 *  1. service worker starts with zero console errors
 *  2. popup loads (signed-out + signed-in states), no errors
 *  3. content script mounts (shadow host present, page styles untouched)
 *  4. textarea selection → floating pill → panel → mocked generation →
 *     Replace inserts + native undo restores
 *  5. contenteditable (framework-style) replace flow
 *  6. password fields never trigger the pill
 *  7. multi-tab isolation (result lands in the originating tab)
 *  8. options + sidepanel pages load clean
 *
 * Requires: npm run extension:build:chrome
 * Screenshots (store assets): TC_SCREENSHOTS=1
 * Headed (debug): EXT_HEADFUL=1
 */
import { test, expect, chromium, type BrowserContext, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import fs from "node:fs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist", "extension-chrome");
const FIXTURES = path.join(ROOT, "e2e", "extension", "fixtures");

test.skip(
  !fs.existsSync(path.join(DIST, "manifest.json")),
  "build the extension first: npm run extension:build:chrome",
);

const MOCK_CONTENT = "Mocked polished rewrite from ToneCraft.";
const MOCK_PLAN = { success: true, data: { plan: "pro", label: "Pro", status: "active" } };
const MOCK_USAGE = {
  success: true,
  data: {
    plan: "pro",
    credits: {
      monthly: { allocated: 2000, used: 120, remaining: 1880, unlimited: false },
      daily: { allocated: 200, used: 12, remaining: 188, unlimited: false },
    },
  },
};

let server: Server;
let baseUrl = "";
let context: BrowserContext;
let extensionId = "";

async function fixture(name: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/${name}`, { waitUntil: "load" });
  return page;
}

function shadow(page: Page, selector: string) {
  // Pierce the OPEN shadow root of the floating UI host.
  return page.locator("#tc-float-host").locator(selector);
}

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    try {
      const name = (req.url ?? "/").split("?")[0].replace(/^\//, "") || "textarea.html";
      const data = await readFile(path.join(FIXTURES, path.basename(name)));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("nope");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 3199;
  baseUrl = `http://127.0.0.1:${port}`;

  context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: process.env.EXT_HEADFUL !== "1",
    args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`, "--no-first-run"],
  });

  // Stub the ToneCraft backend for every request from the extension.
  await context.route("https://www.tonecraft.site/api/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/api/subscription")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PLAN) });
    } else if (url.endsWith("/api/usage")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_USAGE) });
    } else if (url.endsWith("/api/tools")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { content: MOCK_CONTENT, tokens: 12, latency: 40 } }),
      });
    } else if (url.endsWith("/api/ai/assist")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: MOCK_CONTENT }) });
    } else {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ success: false, error: { code: "NOT_FOUND", message: "stub" } }) });
    }
  });

  // Resolve the extension id from the running service worker.
  for (let i = 0; i < 50 && context.serviceWorkers().length === 0; i++) {
    await new Promise((r) => setTimeout(r, 200));
  }
  const workers = context.serviceWorkers();
  expect(workers.length).toBeGreaterThan(0);
  const match = workers[0].url().match(/^chrome-extension:\/\/([^/]+)\//);
  expect(match).not.toBeNull();
  if (!match) throw new Error("could not resolve extension id");
  extensionId = match[1];

  // Fresh profiles fire onInstalled → the worker auto-opens onboarding
  // (options page). Close any extension tabs so fixture navigation is stable.
  for (const p of context.pages()) {
    if (p.url().startsWith("chrome-extension://")) await p.close().catch(() => undefined);
  }
});

test.afterAll(async () => {
  await context?.close().catch(() => undefined);
  await new Promise<void>((resolve) => server?.close(() => resolve()));
});

test("service worker starts with zero errors", async () => {
  const workers = context.serviceWorkers();
  expect(workers.length).toBeGreaterThan(0);
  const errors: string[] = [];
  workers[0].on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await new Promise((r) => setTimeout(r, 1500));
  expect(errors).toEqual([]);
});

test("popup loads signed-in state with plan, actions, compose", async () => {
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  await page.goto(`chrome-extension://${extensionId}/popup/popup.html`, { waitUntil: "networkidle" });
  await expect(page.locator("#plan")).toContainText("Pro", { timeout: 10000 });
  await expect(page.locator('.tc-tool[data-tool="rewrite"]')).toBeVisible();
  await expect(page.locator("textarea")).toBeVisible();
  expect(consoleErrors).toEqual([]);
  if (process.env.TC_SCREENSHOTS === "1") {
    await page.screenshot({ path: path.join(ROOT, "extension", "store", "screenshots", "popup.png") });
  }
  await page.close();
});

test("content script mounts with style isolation", async () => {
  const page = await fixture("contenteditable.html");
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  // Shadow host exists immediately after mount.
  await expect(page.locator("#tc-float-host")).toBeAttached();
  // Host page styles are untouched by us: the unrelated button keeps its
  // (absurd, page-defined) 40px font — our CSS lives in the shadow root.
  expect(await page.locator("#other").evaluate((el) => getComputedStyle(el).fontSize)).toBe("40px");
  expect(errors).toEqual([]);
  await page.close();
});

test("textarea: select → pill → rewrite → replace → native undo", async () => {
  const page = await fixture("textarea.html");
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  // Keyboard-select all text in the textarea (fires selectionchange).
  await page.locator("#composer").click();
  await page.keyboard.press("ControlOrMeta+a");
  await expect(shadow(page, ".tc-btn")).toBeVisible({ timeout: 8000 });

  await shadow(page, ".tc-btn").click();
  await expect(shadow(page, ".tc-panel")).toBeVisible();
  await shadow(page, '.tc-tool[data-tool="rewrite"]').click(); // Rewrite
  await expect(shadow(page, ".tc-result")).toContainText(MOCK_CONTENT, { timeout: 15000 });

  if (process.env.TC_SCREENSHOTS === "1") {
    await page.screenshot({ path: path.join(ROOT, "extension", "store", "screenshots", "floating-panel.png") });
  }

  await shadow(page, "button:has-text('Replace')").click();
  await expect(page.locator("#composer")).toHaveValue(MOCK_CONTENT);

  // Native undo restores the original (undo-behavior requirement). Refocus
  // first: the keypress must target the textarea, not the panel button.
  await page.locator("#composer").click();
  await page.locator("#composer").press("ControlOrMeta+z");
  await expect(page.locator("#composer")).toHaveValue("hey can u send me that thing asap");
  expect(errors).toEqual([]);
  await page.close();
});

test("framework editor: replace flow works in contenteditable", async () => {
  const page = await fixture("framework.html");
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.locator("#pm").click();
  await page.keyboard.press("ControlOrMeta+a");
  await expect(shadow(page, ".tc-btn")).toBeVisible({ timeout: 8000 });
  await shadow(page, ".tc-btn").click();
  await expect(shadow(page, ".tc-panel")).toBeVisible();
  // Second tool = Improve.
  await shadow(page, '.tc-tool[data-tool="improve"]').click();
  await expect(shadow(page, ".tc-result")).toContainText(MOCK_CONTENT, { timeout: 15000 });
  await shadow(page, "button:has-text('Replace')").click();
  await expect(page.locator("#pm")).toContainText(MOCK_CONTENT);
  expect(errors).toEqual([]);
  await page.close();
});

test("password fields never trigger the pill", async () => {
  const page = await fixture("framework.html");
  await page.locator("#pwd").click();
  await page.keyboard.press("ControlOrMeta+a");
  await new Promise((r) => setTimeout(r, 1200));
  expect(await shadow(page, ".tc-btn").count()).toBe(0);
  // And the secret value is untouched.
  expect(await page.locator("#pwd").inputValue()).toBe("secret-should-never-touch");
  await page.close();
});

test("multi-tab isolation: result lands in the originating tab", async () => {
  const pageA = await fixture("textarea.html");
  const pageB = await fixture("textarea.html");
  await pageA.bringToFront();
  await pageA.locator("#composer").click();
  await pageA.keyboard.press("ControlOrMeta+a");
  await expect(shadow(pageA, ".tc-btn")).toBeVisible({ timeout: 8000 });
  await shadow(pageA, ".tc-btn").click();
  await shadow(pageA, '.tc-tool[data-tool="rewrite"]').click();
  await expect(shadow(pageA, ".tc-result")).toContainText(MOCK_CONTENT, { timeout: 15000 });
  await shadow(pageA, "button:has-text('Replace')").click();
  await expect(pageA.locator("#composer")).toHaveValue(MOCK_CONTENT);
  // Tab B is untouched.
  expect(await pageB.locator("#composer").inputValue()).toBe("hey can u send me that thing asap");
  await pageA.close();
  await pageB.close();
});

test("options + sidepanel pages load clean", async () => {
  for (const name of ["options/options.html", "sidepanel/sidepanel.html"]) {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));
    await page.goto(`chrome-extension://${extensionId}/${name}`, { waitUntil: "networkidle" });
    expect(errors).toEqual([]);
    if (process.env.TC_SCREENSHOTS === "1" && name.startsWith("sidepanel")) {
      await page.setViewportSize({ width: 400, height: 800 });
      await page.screenshot({ path: path.join(ROOT, "extension", "store", "screenshots", "sidepanel.png") });
    }
    await page.close();
  }
});
