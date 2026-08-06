import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS: ReadonlyArray<string> = [
  "/",
  "/login",
  "/register",
  "/onboarding",
  "/pricing",
  "/features",
  "/about",
  "/privacy",
  "/terms",
  "/blog",
  // Public status pages (12.3)
  "/status",
  "/health",
    "/api/webhook",
  "/api/auth",
  "/api/health",
  // Background worker entrypoint — guarded by the CRON_SECRET header, not a user session.
  "/api/cron",
  // Paddle webhook — public by design; the Paddle signature check is the auth.
  // (Audit 12 P0.2: it was previously behind Clerk auth, so subscriptions never activated.)
  "/api/billing/webhook",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (!isPublicPath(req.nextUrl.pathname)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
