import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Abbreviates large counts for dashboard stats — 1_500 → "1.5K", 2_400_000 → "2.4M". */
export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

/**
 * Only allow internal, relative redirect targets — blocks open-redirect
 * attempts such as `?redirect_url=https://evil.example` and the
 * protocol-relative `//evil.example` / `/\evil.example` bypasses.
 */
export function safeRedirectUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  if (!u.startsWith("/")) return undefined;
  if (u.startsWith("//") || u.startsWith("/\\")) return undefined;
  return u;
}

export function timeAgo(date: Date | string, addSuffix = true): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (seconds < 60) return addSuffix ? rtf.format(-Math.max(seconds, 1), "second") : `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return addSuffix ? rtf.format(-minutes, "minute") : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return addSuffix ? rtf.format(-hours, "hour") : `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return addSuffix ? rtf.format(-days, "day") : `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return addSuffix ? rtf.format(-months, "month") : `${months}mo`;
  const years = Math.floor(months / 12);
  return addSuffix ? rtf.format(-years, "year") : `${years}y`;
}
