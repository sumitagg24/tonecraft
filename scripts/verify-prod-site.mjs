import { chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 200)));

  for (const path of ["/", "/pricing", "/sign-up", "/sign-in"]) {
    try {
      await page.goto("https://tonecraft-psi.vercel.app" + path, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      const title = await page.title();
      const body = (await page.locator("body").innerText().catch(() => "")).replace(/\n+/g, " | ").slice(0, 500);
      const devMode = await page.getByText("Development mode", { exact: false }).count();
      console.log(`\n=== ${path} ===`);
      console.log("title:", title);
      console.log("body:", body);
      console.log("'Development mode' occurrences:", devMode);
    } catch (e) {
      console.log(`\n=== ${path} === FAILED: ${String(e).slice(0, 250)}`);
    }
  }

  console.log("\n=== console/page errors ===");
  for (const e of errors.slice(0, 10)) console.log("-", e);
  if (!errors.length) console.log("(none)");

  await browser.close();
})();
