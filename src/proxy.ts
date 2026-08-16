import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkAuthRouteLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/request-ip";

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
  // SEO/LLM metadata files — crawlers must reach these without a session.
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
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
  const { pathname } = req.nextUrl;

  // Rate-limit credential submissions on the authentication surface
  // (defense-in-depth; Clerk enforces per-account password-attempt limits
  // natively). Clerk's sign-in / sign-up attempts are proxied through
  // /__clerk/v1/client/sign_ins and /sign_ups — those POSTs get a strict
  // per-IP window plus an exponential backoff rather than a hard lockout.
  // Page loads are intentionally NOT limited: Clerk components prefetch the
  // auth pages as RSC requests from every public page, so throttling pages
  // would block legitimate traffic. Thresholds are env-configurable
  // (RATE_LIMIT_AUTH_* — see lib/ratelimit).
  const isAuthAttempt =
    req.method === "POST" && pathname.startsWith("/__clerk/v1/client/sign_");
  if (isAuthAttempt) {
    const check = await checkAuthRouteLimit(getClientIp(req));
    if (!check.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many attempts — try again later.",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(check.retryAfterSeconds ?? 60) },
        },
      );
    }
  }

  if (!isPublicPath(pathname)) {
    await auth.protect();
  }
});

export const config = {
  // Static assets (manifest, service worker, icons, images, fonts) must bypass
  // Clerk auth entirely — otherwise /site.webmanifest & /sw.js redirect to
  // /sign-in and the browser loops forever (observed in dev logs).
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Clerk's frontend API proxy lives at /__clerk/* and MUST always run
    // through clerkMiddleware — including the .js clerk-js bundle at
    // /__clerk/npm/... The static-asset exclusion above would otherwise
    // skip it, Next.js would serve its own 404 HTML for it, and the browser
    // would refuse to execute it ("MIME type text/html not executable"),
    // leaving /sign-in and /sign-up completely blank in production.
    "/__clerk(.*)",
  ],
};
