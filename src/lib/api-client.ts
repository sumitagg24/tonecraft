/**
 * Client-side fetch helper for the standardized API envelope.
 *
 * Every JSON API route returns:
 *   Success: { success: true,  data: T }
 *   Failure: { success: false, error: { code, message, details? } }
 *
 * `api<T>()` unwraps `.data` and throws a typed `ApiError` on failure
 * (including network errors and non-JSON responses).
 *
 * SSE endpoints (chat streaming, notifications stream) are consumed with raw
 * `fetch` / `EventSource` and must NOT go through this helper.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch (error) {
    // Preserve abort semantics (used by search, streaming, unmount cleanup)
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Network error"
    );
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(res.status, "INVALID_RESPONSE", `Unexpected response (${res.status})`);
  }

  if (envelope?.success === false) {
    throw new ApiError(
      res.status,
      envelope.error?.code ?? "REQUEST_FAILED",
      envelope.error?.message ?? `Request failed (${res.status})`,
      envelope.error?.details
    );
  }
  if (!res.ok) {
    throw new ApiError(res.status, "REQUEST_FAILED", `Request failed (${res.status})`);
  }
  return envelope.data as T;
}

/** Convenience JSON-body POST. */
export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
