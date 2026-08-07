export function maskSecret(secret: string): string {
  if (!secret || secret.length < 8) return "********";
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

export function sanitizeLogPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ["password", "secret", "token", "apiKey", "authorization", "cookie"];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogPayload(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
