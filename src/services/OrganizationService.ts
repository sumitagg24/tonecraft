import { prisma } from "@/lib/prisma";
import { Prisma, type OrgRole } from "@prisma/client";
import { parseBranding, type OrgBranding } from "@/lib/branding";

/**
 * Phase 13 — Enterprise organization system.
 *
 * Hierarchy: Organization (Company) → Team → Workspace → Project.
 *
 * - Organizations are owned by a user (the `owner`) and have org-level
 *   members with roles (`owner | admin | manager | member`) plus an optional
 *   department label.
 * - Teams are sub-groups (departments) inside an org; workspaces can be
 *   assigned to a team.
 * - Workspaces already existed as the collaboration unit; adding
 *   `organizationId`/`teamId` nests them under the org hierarchy without
 *   breaking existing single-user workspaces.
 */

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  plan?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  plan?: string;
}

export interface AddMemberInput {
  userId: string;
  role?: OrgRole;
  department?: string;
}

export interface TeamInput {
  name: string;
  description?: string;
  department?: string;
  color?: string;
}

const SAFE_USER = { id: true, name: true, email: true, image: true } as const;

export class OrganizationService {
  // ─── Organizations ────────────────────────────────────────────────────

  async createOrganization(userId: string, input: CreateOrganizationInput) {
    const org = await prisma.organization.create({
      data: {
        name: input.name,
        slug: normalizeSlug(input.slug),
        plan: input.plan ?? "enterprise",
        ownerId: userId,
      },
    });
    // Owner is implicitly the org admin (org-level membership row).
    await prisma.organizationMember.create({
      data: { organizationId: org.id, userId, role: "owner" },
    });
    // Default security policy so reads never have to coalesce.
    await prisma.securityPolicy.create({
      data: { organizationId: org.id },
    });
    return org;
  }

  async listOrganizationsForUser(userId: string) {
    return prisma.organization.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
      include: { _count: { select: { members: true, teams: true, workspaces: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOrganization(organizationId: string, userId: string) {
    const member = await this.getMembership(organizationId, userId);
    if (!member) return null;
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: { select: { members: true, teams: true, workspaces: true } },
        security: true,
      },
    });
    return org ? { ...org, role: member.role } : null;
  }

  /** Org-level role for a user — `null` when they're not a member. */
  async getMembership(organizationId: string, userId: string) {
    return prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { role: true, department: true },
    });
  }

  /** True when the user may manage the org (owner or admin). */
  async canManage(organizationId: string, userId: string): Promise<boolean> {
    const m = await this.getMembership(organizationId, userId);
    return m?.role === "owner" || m?.role === "admin";
  }

  async updateOrganization(organizationId: string, userId: string, input: UpdateOrganizationInput) {
    if (!(await this.canManage(organizationId, userId))) return null;
    return prisma.organization.update({
      where: { id: organizationId },
      data: { ...input, updatedAt: new Date() },
    });
  }

  async deleteOrganization(organizationId: string, userId: string): Promise<boolean> {
    const member = await this.getMembership(organizationId, userId);
    if (member?.role !== "owner") return false;
    const res = await prisma.organization.deleteMany({ where: { id: organizationId } });
    return res.count > 0;
  }

  // ─── Members ──────────────────────────────────────────────────────────

  async listMembers(organizationId: string, userId: string) {
    if (!(await this.getMembership(organizationId, userId))) return null;
    return prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: { select: SAFE_USER } },
      orderBy: [{ createdAt: "asc" }],
    });
  }

  async addMember(organizationId: string, actorId: string, input: AddMemberInput) {
    if (!(await this.canManage(organizationId, actorId))) return null;
    const role = input.role ?? "member";
    // Only an existing owner may grant the owner role (prevents admin escalation).
    if (role === "owner") {
      const actor = await this.getMembership(organizationId, actorId);
      if (actor?.role !== "owner") return null;
    }
    const member = await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId, userId: input.userId } },
      create: {
        organizationId,
        userId: input.userId,
        role,
        department: input.department ?? null,
      },
      update: { role, department: input.department ?? null },
      include: { user: { select: SAFE_USER } },
    });
    return member;
  }

  async updateMemberRole(organizationId: string, actorId: string, targetUserId: string, role: OrgRole, department?: string | null) {
    if (!(await this.canManage(organizationId, actorId))) return null;
    const actor = await this.getMembership(organizationId, actorId);
    // Only an existing owner may grant the owner role (prevents admin escalation).
    if (role === "owner" && actor?.role !== "owner") return null;
    // Don't let a non-owner demote the owner.
    if (role !== "owner") {
      const target = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId, userId: targetUserId } },
        select: { role: true },
      });
      if (target?.role === "owner") return null;
    }
    // Empty string clears the department; undefined leaves it unchanged.
    const departmentData = department === undefined ? undefined : (department === "" ? null : department);
    return prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId: targetUserId } },
      data: { role, ...(departmentData !== undefined ? { department: departmentData } : {}) },
    });
  }

  async removeMember(organizationId: string, actorId: string, targetUserId: string): Promise<boolean> {
    if (!(await this.canManage(organizationId, actorId))) return false;
    const target = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: targetUserId } },
      select: { role: true },
    });
    if (target?.role === "owner") return false;
    const res = await prisma.organizationMember.deleteMany({
      where: { organizationId, userId: targetUserId },
    });
    return res.count > 0;
  }

  // ─── Teams ────────────────────────────────────────────────────────────

  async listTeams(organizationId: string, userId: string) {
    if (!(await this.getMembership(organizationId, userId))) return null;
    return prisma.team.findMany({
      where: { organizationId },
      include: { _count: { select: { workspaces: true } } },
      orderBy: [{ department: "asc" }, { name: "asc" }],
    });
  }

  async createTeam(organizationId: string, userId: string, input: TeamInput) {
    if (!(await this.canManage(organizationId, userId))) return null;
    return prisma.team.create({
      data: {
        organizationId,
        name: input.name,
        description: input.description ?? null,
        department: input.department ?? null,
        color: input.color ?? "#6366F1",
      },
    });
  }

  async updateTeam(organizationId: string, userId: string, teamId: string, input: Partial<TeamInput>) {
    if (!(await this.canManage(organizationId, userId))) return null;
    const team = await prisma.team.findFirst({ where: { id: teamId, organizationId } });
    if (!team) return null;
    return prisma.team.update({
      where: { id: teamId },
      data: { ...input, updatedAt: new Date() },
    });
  }

  async deleteTeam(organizationId: string, userId: string, teamId: string): Promise<boolean> {
    if (!(await this.canManage(organizationId, userId))) return false;
    const res = await prisma.team.deleteMany({ where: { id: teamId, organizationId } });
    return res.count > 0;
  }

  // ─── Workspace assignment ─────────────────────────────────────────────

  async assignWorkspace(organizationId: string, userId: string, workspaceId: string, teamId: string | null) {
    if (!(await this.canManage(organizationId, userId))) return null;
    // Only workspaces the user owns OR that are already in the org.
    const ws = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ userId }, { organizationId }],
      },
    });
    if (!ws) return null;
    if (teamId) {
      const team = await prisma.team.findFirst({ where: { id: teamId, organizationId } });
      if (!team) return null;
    }
    return prisma.workspace.update({
      where: { id: workspaceId },
      data: { organizationId, teamId: teamId ?? null, updatedAt: new Date() },
    });
  }

  // ─── SSO ──────────────────────────────────────────────────────────────

  async getSsoConfig(organizationId: string, userId: string) {
    if (!(await this.getMembership(organizationId, userId))) return null;
    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { sso: true } });
    return parseSsoConfig(org?.sso);
  }

  async updateSsoConfig(organizationId: string, userId: string, config: SsoConfig) {
    if (!(await this.canManage(organizationId, userId))) return null;
    await prisma.organization.update({
      where: { id: organizationId },
      data: { sso: config as unknown as Prisma.InputJsonValue, updatedAt: new Date() },
    });
    return config;
  }

  // ─── Branding ─────────────────────────────────────────────────────────

  async getBranding(organizationId: string, userId: string) {
    if (!(await this.getMembership(organizationId, userId))) return null;
    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { branding: true } });
    return parseBranding(org?.branding);
  }

  async updateBranding(organizationId: string, userId: string, branding: OrgBranding) {
    if (!(await this.canManage(organizationId, userId))) return null;
    await prisma.organization.update({
      where: { id: organizationId },
      data: { branding: branding as Prisma.InputJsonValue, updatedAt: new Date() },
    });
    return branding;
  }

  // ─── Org-scoped audit ─────────────────────────────────────────────────

  async listAuditLogs(organizationId: string, userId: string, opts: { page?: number; perPage?: number; action?: string } = {}) {
    if (!(await this.canManage(organizationId, userId))) return null;
    const { page = 1, perPage = 50, action } = opts;
    const where = {
      organizationId,
      ...(action ? { action } : {}),
    } as Prisma.AuditLogWhereInput;
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: SAFE_USER } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, perPage };
  }
}

// ─── SSO config shape + parser ─────────────────────────────────────────

export type SsoProvider = "google_workspace" | "azure_ad" | "okta";

export interface SsoProviderConfig {
  provider: SsoProvider;
  enabled: boolean;
  /** Allowed email domains for this provider (e.g. ["acme.com"]). */
  domains: string[];
}

export interface SsoConfig {
  /** Require SSO for all org members (no password sign-in). */
  enforced: boolean;
  providers: SsoProviderConfig[];
  /** SAML metadata URL (Okta/Azure) or issuer entity ID. */
  samlMetadataUrl?: string | null;
}

export const DEFAULT_SSO_CONFIG: SsoConfig = {
  enforced: false,
  providers: [
    { provider: "google_workspace", enabled: false, domains: [] },
    { provider: "azure_ad", enabled: false, domains: [] },
    { provider: "okta", enabled: false, domains: [] },
  ],
  samlMetadataUrl: null,
};

/** Slugify: lowercase, alphanumerics + hyphens, trimmed of leading/trailing dashes. */
function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
}

export function parseSsoConfig(raw: unknown): SsoConfig {
  if (!raw || typeof raw !== "object") return structuredClone(DEFAULT_SSO_CONFIG);
  const cfg = raw as Record<string, unknown>;
  const providers = Array.isArray(cfg.providers) ? cfg.providers : DEFAULT_SSO_CONFIG.providers;
  return {
    enforced: typeof cfg.enforced === "boolean" ? cfg.enforced : DEFAULT_SSO_CONFIG.enforced,
    providers: providers.map((p) => {
      const pp = p as Record<string, unknown>;
      return {
        provider: (["google_workspace", "azure_ad", "okta"] as SsoProvider[]).includes(pp.provider as SsoProvider)
          ? (pp.provider as SsoProvider)
          : "google_workspace",
        enabled: typeof pp.enabled === "boolean" ? pp.enabled : false,
        domains: Array.isArray(pp.domains) ? (pp.domains as string[]).filter((d) => typeof d === "string") : [],
      };
    }),
    samlMetadataUrl: typeof cfg.samlMetadataUrl === "string" ? cfg.samlMetadataUrl : null,
  };
}

/**
 * True when the given email domain is allowed by the org's SSO config.
 *
 * Rules:
 *  - No enabled provider → no restriction (SSO not configured).
 *  - An enabled provider with an EMPTY domain list → no restriction from that
 *    provider (matches the precedent above; avoids fail-closed lockout when
 *    an admin enables a provider before entering domains).
 *  - Otherwise the domain must be in an enabled provider's allowlist.
 */
export function isDomainAllowedBySso(config: SsoConfig, email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  const enabled = config.providers.filter((p) => p.enabled);
  if (enabled.length === 0) return true;
  return enabled.some((p) => p.domains.length === 0 || p.domains.map((d) => d.toLowerCase()).includes(domain));
}

export const organizationService = new OrganizationService();
