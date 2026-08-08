import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS: ReadonlyArray<string> = [
  "/",
  // Clerk auth pages — MUST be public or auth.protect() re-protects them and
  // every unauthenticated user hits an infinite redirect loop (/chat → /sign-in → /chat).
  "/sign-in",
  "/sign-up",
  "/login",
  "/register",
  "/onboarding",
  "/pricing",
  "/features",
  "/about",
  "/privacy",
  "/terms",
  "/blog",
  "/help",
  "/demo",
  "/roadmap",
  "/faq",
  "/changelog",
  "/solutions",
  "/share",
  // All API routes are middleware-public ON PURPOSE: every route handler
  // authenticates itself (withApiHandler defaults auth:true, cron uses its
  // own guard) and returns a JSON 401/403 instead of a redirect. Do not
  // "simplify" this back into a protected path or unauthenticated API calls
  // will start redirecting to /sign-in.
  "/api",
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
  // Static assets (manifest, service worker, icons, images, fonts) must bypass
  // Clerk auth entirely — otherwise /site.webmanifest & /sw.js redirect to
  // /sign-in and the browser loops forever (observed in dev logs).
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
