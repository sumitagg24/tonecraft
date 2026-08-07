import { logger } from "@/lib/logger";

export type ErrorCategory =
  | "frontend_crash"
  | "backend_exception"
  | "ai_provider_error"
  | "payment_error"
  | "websocket_error";

export interface ErrorReportContext {
  userId?: string;
  workspaceId?: string;
  endpoint?: string;
  provider?: string;
  metadata?: Record<string, unknown>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export class ErrorMonitoringService {
  captureException(error: unknown, category: ErrorCategory, context?: ErrorReportContext): void {
    const errObj = error instanceof Error ? error : new Error(String(error));

    logger.error(`[ErrorMonitoring:${category}] ${errObj.message}`, {
      stack: errObj.stack,
      category,
      ...context,
    });

    // Sentry hook if configured
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(errObj, {
        tags: { category, provider: context?.provider },
        extra: context,
      });
    }

    // BetterStack / Logtail HTTP ingest hook if token is set
    const logtailToken = process.env.LOGTAIL_SOURCE_TOKEN || process.env.NEXT_PUBLIC_LOGTAIL_TOKEN;
    if (logtailToken && typeof fetch !== "undefined") {
      fetch("https://in.logs.betterstack.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${logtailToken}`,
        },
        body: JSON.stringify({
          dt: new Date().toISOString(),
          level: "error",
          message: errObj.message,
          stack: errObj.stack,
          category,
          context,
        }),
      }).catch(() => {
        /* silent fallback */
      });
    }
  }
}

export const errorMonitoring = new ErrorMonitoringService();
