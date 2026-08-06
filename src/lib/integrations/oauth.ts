import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";

/**
 * OAuth 2.0 authorization-code flow helpers for Slack + GitHub.
 *
 * Config is read from env vars (SLACK_CLIENT_ID / SLACK_CLIENT_SECRET,
 * GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET). Services without credentials fall
 * back to the simulated connect path so the app keeps working in dev.
 */

export type OAuthService = "slack" | "github";

interface OAuthProviderConfig {
  service: OAuthService;
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
  scope: string;
}

export const OAUTH_PROVIDERS: Record<OAuthService, OAuthProviderConfig> = {
  slack: {
    service: "slack",
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    scope: "chat:write files:write",
  },
  github: {
    service: "github",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    scope: "repo read:user",
  },
};

export function isOAuthConfigured(service: string): boolean {
  const provider = OAUTH_PROVIDERS[service as OAuthService];
  return Boolean(provider && provider.clientId && provider.clientSecret);
}

/** CSRF-protection token, bound to the user's browser via an httpOnly cookie. */
export function generateOAuthState(): string {
  return randomBytes(32).toString("hex");
}

export function buildOAuthUrl(service: string, redirectUri: string, state: string): string {
  const provider = OAUTH_PROVIDERS[service as OAuthService];
  if (!provider?.clientId) {
    throw new Error(`OAuth not configured for ${service}`);
  }
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: redirectUri,
    scope: provider.scope,
    state,
  });
  return `${provider.authorizeUrl}?${params.toString()}`;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string | null;
  scope?: string;
  expiresAt?: string | null;
  account?: string;
  team?: string | null;
}

/**
 * Exchange the authorization code for tokens. Throws on provider errors —
 * tokens are never logged.
 */
export async function exchangeOAuthCode(
  service: string,
  code: string,
  redirectUri: string
): Promise<OAuthTokens> {
  const provider = OAUTH_PROVIDERS[service as OAuthService];
  if (!provider?.clientId || !provider.clientSecret) {
    throw new Error(`OAuth not configured for ${service}`);
  }

  if (service === "slack") {
    const form = new URLSearchParams({
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      code,
      redirect_uri: redirectUri,
    });
    const res = await fetch(provider.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      access_token?: string;
      refresh_token?: string;
      scope?: string;
      team?: { name?: string };
      authed_user?: { id?: string };
    };
    if (!data.ok || !data.access_token) {
      logger.error(`[OAuth] Slack token exchange failed: ${data.error ?? "unknown"}`);
      throw new Error(data.error ?? "Slack OAuth failed");
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      scope: data.scope,
      account: data.authed_user?.id ?? "slack",
      team: data.team?.name,
    };
  }

  // GitHub
  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    logger.error(`[OAuth] GitHub token exchange failed: ${data.error_description ?? data.error ?? "unknown"}`);
    throw new Error(data.error_description ?? data.error ?? "GitHub OAuth failed");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    scope: typeof data.scope === "string" ? data.scope : undefined,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
    account: "github",
  };
}
