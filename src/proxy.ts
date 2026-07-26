import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/onboarding",
  "/pricing",
  "/features",
  "/about(.*)",
  "/privacy",
  "/terms",
  "/blog(.*)",
  "/api/stripe/webhook",
  "/api/webhook(.*)",
  "/api/auth(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
