/**
 * True when an error is a cancellation rather than a failure.
 *
 * Cancellations (client disconnect, `AbortController.abort()`, unmount cleanup)
 * must never be logged as errors or recovered through a fallback path. Idle
 * timeouts (`TimeoutError`) are deliberately excluded — those are failures.
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) return error.name === "AbortError";
  return error instanceof Error && error.name === "AbortError";
}
