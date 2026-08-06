import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "./logger";
import { z, ZodError } from "zod";
import { checkEndpointLimit, checkIpLimit } from "./ratelimit";

/**
 * Standardized API handler used by every JSON API route.
 *
 * Response contract (one format everywhere):
 *   Success: { success: true,  data: T }
 *   Failure: { success: false, error: { code, message, details? } }
 *
 * The wrapper handles: Clerk auth, zod validation, try/catch, request logging,
 * request ids, and status codes. Routes return plain values via `ok()` / `fail()`.
 *
 * Documented exceptions that keep their native protocols (not JSON envelopes):
 *  - SSE streams (chats/[chatId]/messages POST, notifications/stream GET)
 *  - Webhooks (webhook/clerk, billing/webhook) — signature-verified
 *  - /api/health — public liveness payload
 */

export interface ApiHandlerContext {
  user: { id: string };
  request: NextRequest;
  params: Record<string, string>;
}

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResult<T = unknown> =
  | { success: true; data: T; status?: number }
  | { success: false; error: ApiErrorBody; status?: number };

export type ApiHandler<T = unknown, B = unknown> = (
  ctx: ApiHandlerContext,
  body: B
) => ApiResult<T> | Promise<ApiResult<T>>;

export interface WithApiHandlerOptions<S extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Zod schema — when provided, the body is parsed and validated before the handler runs. */
  schema?: S;
  /** Require a Clerk session. Defaults to true. */
  auth?: boolean;
  /**
   * Phase 12.4 — per-endpoint rate limit (requests/minute per user) plus an
   * IP ceiling when `ipLimit` is set. Applied before the handler runs.
   */
  rateLimit?: {
    limit: number;
    ipLimit?: number;
    key: string;
  };
}

/** Best-effort client IP (x-forwarded-for from the proxy). */
function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Success helper — returns `{ success: true, data }`. */
export const ok = <T>(data: T, status = 200): ApiResult<T> => ({
  success: true,
  data,
  status,
});

/** Failure helper — returns `{ success: false, error: { code, message, details? } }`. */
export const fail = (
  code: string,
  message: string,
  status = 400,
  details?: unknown
): ApiResult<never> => ({
  success: false,
  error: details === undefined ? { code, message } : { code, message, details },
  status,
});

export const unauthorized = (): ApiResult<never> =>
  fail("UNAUTHORIZED", "Unauthorized", 401);

export const notFound = (): ApiResult<never> => fail("NOT_FOUND", "Not found", 404);

export const forbidden = (): ApiResult<never> => fail("FORBIDDEN", "Forbidden", 403);

export function flattenZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "body";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

type RouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

function buildHandler(
  handler: ApiHandler,
  options: WithApiHandlerOptions,
  method: string
): RouteHandler {
  const { schema, auth: requireAuth = true, rateLimit } = options;

  return async (req, ctx) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID().slice(0, 8);

    // 1. Authentication
    let session: { user: { id: string } } | null = null;
    if (requireAuth) {
      session = await auth();
      if (!session?.user?.id) {
        logger.warn(`[API] Unauthorized ${requestId} ${method} ${req.nextUrl.pathname}`);
        return NextResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
          { status: 401 }
        );
      }
    }

    // 1b. Phase 12.4 — optional per-endpoint rate limiting (per user + per IP).
    if (rateLimit && session?.user?.id) {
      const userLimit = await checkEndpointLimit(rateLimit.key, session.user.id, rateLimit.limit);
      const ipLimited = rateLimit.ipLimit
        ? !(await checkIpLimit(getClientIp(req), rateLimit.ipLimit)).allowed
        : false;
      if (!userLimit.allowed || ipLimited) {
        logger.warn(`[API] Rate limited ${requestId} ${method} ${req.nextUrl.pathname}`, {
          userId: session.user.id,
          key: rateLimit.key,
        });
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: `Rate limit exceeded — try again in a minute (${rateLimit.limit}/min)`,
            },
          },
          { status: 429 }
        );
      }
    }

    // 2. Body parsing (JSON only — multipart/form-data is read by handlers directly)
    let body: unknown;
    const contentType = req.headers.get("content-type") ?? "";
    if (schema || method === "POST" || method === "PATCH" || method === "PUT") {
      const isJson = contentType === "" || contentType.includes("application/json");
      if (isJson) {
        try {
          body = await req.json();
        } catch {
          body = undefined;
        }
      }
    }

    // 3. Validation — never serialize a raw ZodError
    if (schema) {
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        const message = flattenZodError(parsed.error);
        logger.warn(
          `[API] Validation failed ${requestId} ${method} ${req.nextUrl.pathname}: ${message}`
        );
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message,
              details: parsed.error.issues,
            },
          },
          { status: 400 }
        );
      }
      body = parsed.data;
    }

    const params = await ctx.params;

    // 4. Handler + try/catch
    try {
      const result = await handler(
        { user: session?.user ?? { id: "" }, request: req, params },
        body
      );
      logger.debug(
        `[API] ${requestId} ${method} ${req.nextUrl.pathname} ${Date.now() - startTime}ms`
      );
      if (result.success) {
        return NextResponse.json(
          { success: true, data: result.data },
          { status: result.status ?? 200 }
        );
      }
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status ?? 400 }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[API] ${requestId} ${method} ${req.nextUrl.pathname} ${duration}ms`, error);
      return NextResponse.json(
        {
          success: false,
          error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
        },
        { status: 500 }
      );
    }
  };
}

export function withApiHandler(options: WithApiHandlerOptions = {}) {
  return {
    GET: (handler: ApiHandler) => buildHandler(handler, options, "GET"),
    POST: (handler: ApiHandler) => buildHandler(handler, options, "POST"),
    PATCH: (handler: ApiHandler) => buildHandler(handler, options, "PATCH"),
    PUT: (handler: ApiHandler) => buildHandler(handler, options, "PUT"),
    DELETE: (handler: ApiHandler) => buildHandler(handler, options, "DELETE"),
  };
}
