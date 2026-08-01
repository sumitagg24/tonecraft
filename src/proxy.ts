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
    "/api/webhook",
  "/api/auth",
  "/api/health",
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
