type LogLevel = "debug" | "info" | "warn" | "error";

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

export const logger = {
  debug: (message: string, meta?: unknown) => {
    if (shouldLog("debug")) console.warn(formatMessage("debug", message, meta));
  },
  info: (message: string, meta?: unknown) => {
    if (shouldLog("info")) console.warn(formatMessage("info", message, meta));
  },
  warn: (message: string, meta?: unknown) => {
    if (shouldLog("warn")) console.warn(formatMessage("warn", message, meta));
  },
  error: (message: string, meta?: unknown) => {
    if (shouldLog("error")) console.error(formatMessage("error", message, meta));
  },
};
