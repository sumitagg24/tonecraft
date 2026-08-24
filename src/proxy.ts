import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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
  "/refunds",
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

const SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Clerk proxy routes at /__clerk/* are internal Clerk-to-Clerk calls.
  // Clerk handles its own rate limiting on the Frontend API, so we skip
  // ALL middleware processing here (auth check, rate limiter, etc.) to
  // minimize latency on every Clerk API call from the browser. This saves
  // ~50-200ms per request by avoiding the auth() promise and Redis call.
  if (pathname.startsWith("/__clerk/")) {
    return;
  }

  if (!isPublicPath(pathname)) {
    // WORKAROUND — Clerk bug #8302: auth.protect() in Next.js 16 proxy
    // resolves signInUrl to "" (unavailable via process.env in the Node.js
    // proxy runtime), so it redirects to the current page instead of /sign-in.
    // We check the session ourselves and redirect manually.
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL(SIGN_IN_URL, req.url);
      signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
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
