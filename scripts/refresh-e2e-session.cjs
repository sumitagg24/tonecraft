/**
 * Refresh .auth/state.json with a freshly-minted Clerk session.
 *
 * Clerk dev-instance sessions are database-backed: the `__session` JWT
 * expires quickly, but loading the app with the existing storage state lets
 * clerk-js re-mint it from the still-valid `__clerk_db_jwt` cookies. This
 * script boots the production server, loads /chat with the current state, and
 * re-saves the refreshed storage state so signed-in e2e specs don't hit a
 * stale JWT.
 *
 * Usage:
 *   node scripts/refresh-e2e-session.cjs
 *
 * Prereqs: a prior `npm run build`, and a `.auth/state.json` whose underlying
 * database session is still valid (i.e. the app still logs the user in).
 *
 * Note: if the database session itself has been revoked, no cookie trick will
 * recover it — sign in once with a headed browser instead:
 *   E2E_STORAGE_STATE=./.auth/state.json E2E_CAPTURE=1 npx playwright test
 *     --headed --grep "save a session"
 */
const { chromium, devices } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const STATE_PATH = path.join(process.cwd(), ".auth", "state.json");

// The desktop project profile (matches what the signed-in specs run under —
// the Clerk dev-instance handshake needs a Chrome UA, not the Safari one).
function desktopUse() {
  return { ...devices["Desktop Chrome"] };
}

async function main() {
  if (!fs.existsSync(STATE_PATH)) {
    console.error(`No existing state at ${STATE_PATH} — capture one first (see header docs)`);
    process.exit(1);
  }

  // Requires a running production server on :3100 (same precondition as
  // `npx playwright test` — its webServer config boots one).
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(2_000) });
    if (!res.ok) throw new Error(`status ${res.status}`);
  } catch {
    console.error(
      `No server on ${BASE_URL}. Start one first, e.g. \`npm run build && npm run start -- -p ${PORT}\``
    );
    process.exit(1);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...desktopUse(),
    storageState: STATE_PATH,
    baseURL: BASE_URL,
  });
  const page = await context.newPage();
  await page.goto("/chat", { waitUntil: "domcontentloaded", timeout: 45_000 });
  // Let clerk-js complete the handshake + JWT refresh.
  await page.waitForTimeout(8_000);

  const url = page.url();
  const signedIn =
    url.includes("/chat") && !url.includes("/sign-in") && !url.includes("chrome-error");
  if (!signedIn) {
    console.error("Did not land signed-in on /chat (final URL: " + url.slice(0, 80) + ")");
    console.error(
      "The database session may be revoked — see the header docs for the headed capture flow."
    );
    process.exit(1);
  }

  await context.storageState({ path: STATE_PATH });
  const fresh = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  const session = fresh.cookies.find((c) => c.name === "__session");
  const payload = JSON.parse(Buffer.from(session.value.split(".")[1], "base64url").toString());
  const now = Math.floor(Date.now() / 1000);
  console.log(
    `Signed in on ${BASE_URL}/chat — refreshed ${STATE_PATH} (__session valid for ~` +
      `${Math.round((payload.exp - now) / 60)} min; clerk-js re-mints on each page load).`
  );

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
