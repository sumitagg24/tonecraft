import { reportError } from "@/lib/error-reporting";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: unknown;
  error?: string;
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  process.env.NODE_ENV === "development" ? "debug" : "info";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${typeof meta === "string" ? meta : JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

function persistLog(entry: LogEntry): void {
  // Dev-only: keep synchronous localStorage writes out of production hot paths.
  if (process.env.NODE_ENV !== "development") return;
  try {
    const logs = JSON.parse(localStorage.getItem("tonecraft-logs") || "[]");
    logs.push(entry);
    if (logs.length > 500) logs.splice(0, logs.length - 500);
    localStorage.setItem("tonecraft-logs", JSON.stringify(logs));
  } catch {
    // storage unavailable
  }
}

export const logger = {
  debug: (message: string, meta?: unknown) => {
    if (shouldLog("debug")) {
      const entry = { timestamp: new Date().toISOString(), level: "debug" as LogLevel, message, meta };
      console.warn(formatMessage("debug", message, meta));
      persistLog(entry);
    }
  },
  info: (message: string, meta?: unknown) => {
    if (shouldLog("info")) {
      const entry = { timestamp: new Date().toISOString(), level: "info" as LogLevel, message, meta };
      console.warn(formatMessage("info", message, meta));
      persistLog(entry);
    }
  },
  warn: (message: string, meta?: unknown) => {
    if (shouldLog("warn")) {
      const entry = { timestamp: new Date().toISOString(), level: "warn" as LogLevel, message, meta };
      console.warn(formatMessage("warn", message, meta));
      persistLog(entry);
    }
  },
  error: (message: string, meta?: unknown, error?: Error) => {
    // Callers sometimes pass an Error as `meta` (e.g. caught unknowns) — normalize it.
    const err = error ?? (meta instanceof Error ? meta : undefined);
    const cleanMeta = meta instanceof Error ? undefined : meta;
    const entry = {
      timestamp: new Date().toISOString(),
      level: "error" as LogLevel,
      message,
      meta: cleanMeta,
      error: err?.stack,
    };
    console.error(formatMessage("error", message, cleanMeta), err ?? "");
    persistLog(entry);
    reportError(err ?? new Error(message), { message, ...(cleanMeta !== undefined && typeof cleanMeta === "object" ? (cleanMeta as Record<string, unknown>) : {}) });
  },
  getLogs: (): LogEntry[] => {
    try {
      return JSON.parse(localStorage.getItem("tonecraft-logs") || "[]");
    } catch {
      return [];
    }
  },
  clearLogs: (): void => {
    try {
      localStorage.removeItem("tonecraft-logs");
    } catch {
      // ignore
    }
  },
};
