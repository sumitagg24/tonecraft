import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { exchangeOAuthCode } from "@/lib/integrations/oauth";
import { integrationService, type IntegrationServiceName } from "@/services/IntegrationService";
import { logger } from "@/lib/logger";

/**
 * OAuth callback — the provider redirects the user's browser here with `code`
 * and `state`. Validates the state cookie (CSRF), exchanges the code for tokens
 * (server-side, never exposed to the client), persists them, then redirects back
 * to the integrations page. Non-JSON endpoint (documented exception).
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const origin = req.nextUrl.origin;
  const home = new URL("/integrations", origin);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const providerError = req.nextUrl.searchParams.get("error");

  const cookieStore = await cookies();
  const saved = cookieStore.get("oauth_state")?.value;
  const [savedState, savedUserId] = saved ? saved.split(":") : [undefined, undefined];

  if (providerError || !code || !state || !savedState || state !== savedState) {
    home.searchParams.set("error", providerError ? "denied" : "state_mismatch");
    return redirectWithCookieDelete(home);
  }

  const session = await auth();
  // The flow must be completed by the same user who started it.
  if (!session?.user?.id || savedUserId !== session.user.id) {
    home.searchParams.set("error", "unauthorized");
    return redirectWithCookieDelete(home);
  }

  try {
    const redirectUri = `${origin}/api/integrations/${id}/callback`;
    const tokens = await exchangeOAuthCode(id, code, redirectUri);
    await integrationService.completeOAuth(session.user.id, id as IntegrationServiceName, tokens);
    home.searchParams.set("connected", id);
    return redirectWithCookieDelete(home);
  } catch (error) {
    logger.error(`[OAuth] ${id} callback failed`, error);
    home.searchParams.set("error", "exchange_failed");
    return redirectWithCookieDelete(home);
  }
}

function redirectWithCookieDelete(target: URL): NextResponse {
  const res = NextResponse.redirect(target, 302);
  res.cookies.delete("oauth_state");
  return res;
}
