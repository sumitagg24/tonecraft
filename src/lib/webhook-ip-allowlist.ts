/**
 * Webhook IP allowlist for Paddle.
 *
 * Fetches Paddle's current IP CIDRs from https://api.paddle.com/ips and caches
 * them. Rejects webhook deliveries from IPs not in the allowlist.
 *
 * @see paddle-webhooks skill — "IP allowlist" section.
 */

import { logger } from "./logger";

// Paddle's published IPv4 CIDRs (fetched from api.paddle.com/ips).
// These are /32 single-host CIDRs.
const DEFAULT_PADDLE_IPV4_CIDRS = [
  "34.237.3.244/32",
  "34.195.105.136/32",
  "34.232.58.13/32",
  "35.155.119.135/32",
  "34.212.5.7/32",
  "52.11.166.252/32",
];

let cachedCidrs: string[] = DEFAULT_PADDLE_IPV4_CIDRS;
let lastFetch = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch Paddle's current IP list. Caches for 1 hour.
 * Falls back to the hardcoded defaults if the fetch fails.
 */
async function fetchPaddleCidrs(): Promise<string[]> {
  const now = Date.now();
  if (now - lastFetch < CACHE_TTL_MS) {
    return cachedCidrs;
  }

  try {
    const res = await fetch("https://api.paddle.com/ips", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as {
      data?: { ipv4_cidrs?: string[]; ipv6_cidrs?: string[] };
    };
    const ipv4 = data.data?.ipv4_cidrs ?? [];
    const ipv6 = data.data?.ipv6_cidrs ?? [];
    const cidrs = [...ipv4, ...ipv6];
    if (cidrs.length > 0) {
      cachedCidrs = cidrs;
      lastFetch = now;
      logger.info("Refreshed Paddle IP allowlist", { count: cidrs.length });
    }
    return cachedCidrs;
  } catch (err) {
    logger.warn("Failed to fetch Paddle IPs, using cached list", {
      error: String(err),
    });
    return cachedCidrs;
  }
}

/**
 * Check if an IPv4 address matches a CIDR range.
 * Handles /32 (single host), /24, /16, /8, and any other prefix.
 */
function ipMatchesCidr(ip: string, cidr: string): boolean {
  const [range, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr, 10);

  const ipNum = ipv4ToNumber(ip);
  const rangeNum = ipv4ToNumber(range);
  if (ipNum === null || rangeNum === null) return false;

  if (prefix === 0) return true; // 0.0.0/0 matches everything

  const mask = (~0 << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => isNaN(n) || n < 0 || n > 255)) return null;
  return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
}

/**
 * Extract the real client IP from request headers.
 * Handles Vercel (x-forwarded-for), Cloudflare (cf-connecting-ip), etc.
 */
export function extractClientIp(headers: Headers): string | null {
  // x-forwarded-for can contain a chain: client, proxy1, proxy2
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? null;
}

/**
 * Check if a request IP is from Paddle's published CIDRs.
 * Returns true if the IP is allowed, false otherwise.
 *
 * In development (NODE_ENV !== "production"), always allows — Paddle
 * webhooks from localhost/sandbox won't come from these IPs.
 */
export async function isIpFromPaddle(ip: string | null): Promise<boolean> {
  // In development, skip IP checks (sandbox webhooks come from various IPs)
  if (process.env.NODE_ENV !== "production") return true;

  // If we can't determine the IP, allow — signature verification is the
  // primary security gate; IP allowlisting is defense-in-depth.
  if (!ip) return true;

  const cidrs = await fetchPaddleCidrs();
  return cidrs.some((cidr) => ipMatchesCidr(ip, cidr));
}
