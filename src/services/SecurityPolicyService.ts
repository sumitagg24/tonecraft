import { prisma } from "@/lib/prisma";
import { organizationService } from "@/services/OrganizationService";

/**
 * Phase 13 — org-level security policies.
 *
 * A SecurityPolicy row is created for every organization (see
 * OrganizationService.createOrganization). Fields cover:
 *  - password policy (length, uppercase, number, symbol, expiry days)
 *  - 2FA enforcement
 *  - session timeout (idle minutes) and max concurrent devices
 *  - IP allowlist (e.g. office CIDRs)
 *
 * Evaluation helpers (`evaluatePassword`, `sessionExpired`) are pure so they
 * can be unit-tested and reused by auth middleware later.
 */

export interface SecurityPolicyInput {
  minPasswordLength?: number;
  requireUppercase?: boolean;
  requireNumber?: boolean;
  requireSymbol?: boolean;
  enforce2fa?: boolean;
  sessionTimeoutMinutes?: number;
  maxDevices?: number;
  passwordExpiryDays?: number | null;
  ipAllowlist?: string[];
}

const DEFAULTS = {
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSymbol: false,
  enforce2fa: false,
  sessionTimeoutMinutes: 60,
  maxDevices: 5,
  passwordExpiryDays: null as number | null,
  ipAllowlist: [] as string[],
};

export class SecurityPolicyService {
  async getPolicy(organizationId: string, userId: string) {
    if (!(await organizationService.getMembership(organizationId, userId))) return null;
    // upsert is race-safe against the @unique(organizationId) constraint when
    // two members read a policy that doesn't exist yet.
    return prisma.securityPolicy.upsert({
      where: { organizationId },
      create: { organizationId },
      update: {},
    });
  }

  async updatePolicy(organizationId: string, userId: string, input: SecurityPolicyInput) {
    if (!(await organizationService.canManage(organizationId, userId))) return null;
    const allowed = Object.keys(DEFAULTS) as (keyof SecurityPolicyInput)[];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (input[key] !== undefined) data[key] = input[key];
    }
    return prisma.securityPolicy.upsert({
      where: { organizationId },
      create: { organizationId, ...data },
      update: data,
    });
  }

  // ─── Pure evaluation helpers (unit-testable) ──────────────────────────

  /** Evaluate a candidate password against the policy. Returns error list (empty = valid). */
  evaluatePassword(policy: { minPasswordLength: number; requireUppercase: boolean; requireNumber: boolean; requireSymbol: boolean }, password: string): string[] {
    const errors: string[] = [];
    if (password.length < policy.minPasswordLength) {
      errors.push(`At least ${policy.minPasswordLength} characters`);
    }
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("At least one uppercase letter");
    }
    if (policy.requireNumber && !/\d/.test(password)) {
      errors.push("At least one number");
    }
    if (policy.requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
      errors.push("At least one symbol");
    }
    return errors;
  }

  /** True when a session's last activity is older than the policy timeout. */
  isSessionExpired(policy: { sessionTimeoutMinutes: number }, lastActivityAt: Date, now: Date = new Date()): boolean {
    const idleMs = policy.sessionTimeoutMinutes * 60 * 1000;
    return now.getTime() - lastActivityAt.getTime() > idleMs;
  }

  /**
   * True when an IP is allowed (empty allowlist = allow all).
   * Supports exact IPs and CIDR ranges (e.g. `203.0.113.0/24`).
   */
  isIpAllowed(policy: { ipAllowlist: string[] }, ip: string): boolean {
    if (!policy.ipAllowlist || policy.ipAllowlist.length === 0) return true;
    return policy.ipAllowlist.some((entry) => ipMatchesEntry(entry.trim(), ip));
  }
}

export const securityPolicyService = new SecurityPolicyService();

// ─── IP/CIDR matching ──────────────────────────────────────────────────

/** Parse `a.b.c.d/n` → [integer IP, prefix length] or null when invalid. */
function parseCidr(entry: string): { ip: number; prefix: number } | null {
  const m = entry.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/);
  if (!m) return null;
  const octets = [m[1], m[2], m[3], m[4]].map(Number);
  if (octets.some((o) => o > 255)) return null;
  const prefix = m[5] === undefined ? 32 : Number(m[5]);
  if (prefix > 32) return null;
  const ip = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
  return { ip, prefix };
}

function ipToInt(ip: string): number | null {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const octets = [m[1], m[2], m[3], m[4]].map(Number);
  if (octets.some((o) => o > 255)) return null;
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

/** True when `ip` equals `entry` (exact IP) or falls inside `entry` (CIDR). */
function ipMatchesEntry(entry: string, ip: string): boolean {
  const parsed = parseCidr(entry);
  const target = ipToInt(ip);
  if (!parsed || target === null) return false;
  const mask = parsed.prefix === 0 ? 0 : (0xffffffff << (32 - parsed.prefix)) >>> 0;
  return (parsed.ip & mask) === (target & mask);
}
