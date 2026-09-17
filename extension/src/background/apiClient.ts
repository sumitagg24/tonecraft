/**
 * ToneCraft extension — API client (service worker).
 *
 * Talks to the EXISTING ToneCraft backend (same routes the website uses, so
 * auth, plan/usage limits, validation and rate limits are enforced
 * server-side exactly as on the web). No AI provider keys ever live here —
 * generation happens server-side; the extension only ships user text and
 * receives result text.
 *
 * Auth chain (no new secrets, same Clerk account as the website):
 *  1. Read the site's `__session` cookie (cookies permission + host
 *     permissions) and send it as `Authorization: Bearer` — Clerk's server
 *     auth accepts session JWTs this way (same mechanism as the realtime
 *     socket handshake).
 *  2. Fall back to `credentials: "include"` (covers any future
 *     SameSite=None configuration).
 *  3. Otherwise the user is signed out → caller shows the sign-in flow.
 */
import { browserApi } from "../shared/browserApi";
import { getPrefs, tokenJar } from "../shared/storage";
import type { ApiEnvelope } from "../shared/types";
import { ExtensionError, fromServerFailure } from "../shared/errors";

const SESSION_COOKIE = "__session";

async function resolveBaseUrl(): Promise<string> {
  const prefs = await getPrefs();
  return prefs.baseUrl;
}

async function resolveAuthHeader(baseUrl: string): Promise<Record<string, string>> {
  // Prefer the freshest token source on every call: the live cookie first,
  // then the in-memory token captured earlier.
  const cookieToken = await browserApi.readSessionCookie(baseUrl, SESSION_COOKIE);
  if (cookieToken) {
    await tokenJar.set(cookieToken);
    return { Authorization: `Bearer ${cookieToken}` };
  }
  const stored = await tokenJar.get();
  if (stored) return { Authorization: `Bearer ${stored}` };
  return {};
}

export interface ApiResult<T> {
  data: T;
}

export class ApiClient {
  private inFlight = new Map<string, AbortController>();

  track(key: string, controller: AbortController): void {
    this.inFlight.set(key, controller);
  }

  untrack(key: string): void {
    this.inFlight.delete(key);
  }

  cancel(key: string): boolean {
    const controller = this.inFlight.get(key);
    if (!controller) return false;
    controller.abort();
    this.inFlight.delete(key);
    return true;
  }

  async request<T>(
    path: string,
    init: RequestInit,
    opts: { signal?: AbortSignal; allowAnonymous?: boolean } = {},
  ): Promise<T> {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new ExtensionError("OFFLINE");
    }
    const baseUrl = await resolveBaseUrl();
    const headers = await resolveAuthHeader(baseUrl);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        ...init,
        signal: opts.signal,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...headers,
          ...(init.headers ?? {}),
        },
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      throw new ExtensionError("OFFLINE");
    }

    let body: ApiEnvelope<T> | null = null;
    try {
      body = (await res.json()) as ApiEnvelope<T>;
    } catch {
      body = null;
    }

    if (!res.ok || !body || body.success === false) {
      const serverCode =
        body && body.success === false ? body.error.code : `HTTP_${res.status}`;
      // 401 here can mean a stale Bearer token while the cookie session is
      // still valid (or vice versa) — drop the cached token so the next call
      // re-reads the live cookie instead of replaying a dead token.
      if (res.status === 401) await tokenJar.clear();
      throw new ExtensionError(fromServerFailure(serverCode, res.status), serverCode);
    }
    return (body as { success: true; data: T }).data;
  }

  get<T>(path: string, opts?: { signal?: AbortSignal }): Promise<T> {
    return this.request<T>(path, { method: "GET" }, opts);
  }

  post<T>(path: string, payload: unknown, opts?: { signal?: AbortSignal }): Promise<T> {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(payload ?? {}) }, opts);
  }
}

export const apiClient = new ApiClient();
