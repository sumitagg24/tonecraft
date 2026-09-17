/**
 * ToneCraft extension — typed errors.
 *
 * Server/network failures are normalized to ExtensionError so every surface
 * (floating UI, popup, side panel) shows a human-friendly message plus the
 * right recovery action. Raw provider/stack details are NEVER surfaced —
 * generated text and tokens are never placed in error metadata.
 */
import { t } from "./strings";

export type ErrorCode =
  | "OFFLINE"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "UPGRADE_REQUIRED"
  | "BAD_INPUT"
  | "SERVER"
  | "INSERT_FAILED"
  | "EDITOR_GONE"
  | "UNKNOWN";

export class ExtensionError extends Error {
  readonly code: ErrorCode;
  /** Machine code from the server envelope (for logs only). */
  readonly serverCode?: string;

  constructor(code: ErrorCode, serverCode?: string) {
    super(code);
    this.name = "ExtensionError";
    this.code = code;
    this.serverCode = serverCode;
  }
}

const MESSAGE_BY_CODE: Record<ErrorCode, string> = {
  OFFLINE: t("err.offline"),
  UNAUTHORIZED: t("err.unauthorized"),
  RATE_LIMITED: t("err.rateLimited"),
  UPGRADE_REQUIRED: t("err.upgrade"),
  BAD_INPUT: t("err.badInput"),
  SERVER: t("err.server"),
  INSERT_FAILED: t("err.insert"),
  EDITOR_GONE: t("err.editorGone"),
  UNKNOWN: t("err.unknown"),
};

export function userMessage(code: ErrorCode): string {
  return MESSAGE_BY_CODE[code] ?? MESSAGE_BY_CODE.UNKNOWN;
}

/**
 * Map a server envelope error code (+ HTTP status) to an extension ErrorCode.
 * Deliberately coarse: never leak server internals to the page.
 */
export function fromServerFailure(serverCode: string, httpStatus: number): ErrorCode {
  if (httpStatus === 401) return "UNAUTHORIZED";
  if (httpStatus === 402 || serverCode === "UPGRADE_REQUIRED" || serverCode === "INSUFFICIENT_CREDITS") {
    return "UPGRADE_REQUIRED";
  }
  if (httpStatus === 429 || serverCode === "RATE_LIMITED") return "RATE_LIMITED";
  if (httpStatus === 400 || serverCode === "VALIDATION_ERROR" || serverCode === "BAD_REQUEST") {
    return "BAD_INPUT";
  }
  return "SERVER";
}
