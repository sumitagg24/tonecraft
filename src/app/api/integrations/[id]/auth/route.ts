import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  buildOAuthUrl,
  generateOAuthState,
  isOAuthConfigured,
} from "@/lib/integrations/oauth";
import { INTEGRATION_SERVICES } from "@/services/IntegrationService";

/**
 * Starts the OAuth authorization-code flow for a service.
 * Non-JSON endpoint (documented exception to the API envelope): it 302-redirects
 * to the provider's consent screen with a state cookie for CSRF protection.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const origin = req.nextUrl.origin;

  if (!INTEGRATION_SERVICES.includes(id as (typeof INTEGRATION_SERVICES)[number])) {
    return NextResponse.redirect(new URL("/integrations?error=unknown_service", origin));
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/sign-in", origin));
  }

  if (!isOAuthConfigured(id)) {
    // No credentials configured — let the page fall back to the simulated flow.
    return NextResponse.redirect(
      new URL(`/integrations?error=not_configured&service=${id}`, origin)
    );
  }

  const state = generateOAuthState();
  const redirectUri = `${origin}/api/integrations/${id}/callback`;
  const authUrl = buildOAuthUrl(id, redirectUri, state);

  const res = NextResponse.redirect(authUrl, 302);
  // Bind the state to the initiating user so another session on the same
  // browser cannot complete (and receive tokens for) someone else's flow.
  res.cookies.set("oauth_state", `${state}:${session.user.id}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes to complete the flow
  });
  return res;
}
