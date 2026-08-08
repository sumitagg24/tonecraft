import { test } from "@playwright/test";
import { expectCleanPage } from "./utils";

/**
 * Regression guard for client-side rendering quality.
 *
 * Every public page must hydrate with zero console errors / hydration
 * mismatches — the moment one is introduced, CI fails with the offending
 * message. The pages below are all publicly reachable without a session (see
 * PUBLIC_PATHS in src/proxy.ts), so this runs headless in CI without secrets.
 */

const PUBLIC_PAGES = [
  { path: "/", name: "landing" },
  { path: "/pricing", name: "pricing" },
  { path: "/features", name: "features" },
  { path: "/about", name: "about" },
  { path: "/blog", name: "blog" },
  { path: "/help", name: "help" },
  { path: "/demo", name: "demo" },
  { path: "/roadmap", name: "roadmap" },
  { path: "/faq", name: "faq" },
  { path: "/changelog", name: "changelog" },
  { path: "/solutions", name: "solutions" },
  { path: "/sign-in", name: "sign-in" },
  { path: "/sign-up", name: "sign-up" },
];

for (const { path, name } of PUBLIC_PAGES) {
  test(`${name} (${path}) renders with no console/hydration errors`, async ({ page }) => {
    await expectCleanPage(page, path);
  });
}
