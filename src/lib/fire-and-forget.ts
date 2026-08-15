import { logger } from "./logger";

/**
 * Run background work that must not block (or fail) the caller.
 *
 * Replaces `void promise` (unhandled rejection) and `.catch(() => {})`
 * (silently swallowed failure): the rejection is always logged through
 * `logger.error`, so it reaches the console and Sentry.
 */
export function fireAndForget(
  work: Promise<unknown>,
  context: string,
  meta?: Record<string, unknown>
): void {
  void work.catch((error: unknown) => {
    logger.error(
      `[background] ${context} failed`,
      meta,
      error instanceof Error ? error : new Error(String(error))
    );
  });
}
