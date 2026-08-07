import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import { securityPolicyService } from "@/services/SecurityPolicyService";
import {
  organizationService,
  parseSsoConfig,
  isDomainAllowedBySso,
  DEFAULT_SSO_CONFIG,
} from "@/services/OrganizationService";
import { parseBranding, brandingCssVars, normalizeHexColor, DEFAULT_BRANDING } from "@/lib/branding";

// --- Mocks -------------------------------------------------------------

jest.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    organizationMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    securityPolicy: {
      create: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    team: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    workspace: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncMock = jest.Mock<(...args: any[]) => Promise<any>>;

const orgCreate = prisma.organization.create as unknown as AsyncMock;
const memberCreate = prisma.organizationMember.create as unknown as AsyncMock;
const memberFindUnique = prisma.organizationMember.findUnique as unknown as AsyncMock;
const memberUpsert = prisma.organizationMember.upsert as unknown as AsyncMock;
const policyCreate = prisma.securityPolicy.create as unknown as AsyncMock;
const policyUpsert = prisma.securityPolicy.upsert as unknown as AsyncMock;
const teamCreate = prisma.team.create as unknown as AsyncMock;
const teamFindFirst = prisma.team.findFirst as unknown as AsyncMock;
const wsFindFirst = prisma.workspace.findFirst as unknown as AsyncMock;
const wsUpdate = prisma.workspace.update as unknown as AsyncMock;

beforeEach(() => {
  jest.clearAllMocks();
  orgCreate.mockResolvedValue({ id: "org-1", name: "Acme", slug: "acme", plan: "enterprise", ownerId: "user-1" });
  memberCreate.mockResolvedValue({ id: "m-1", organizationId: "org-1", userId: "user-1", role: "owner", department: null });
  memberFindUnique.mockResolvedValue({ role: "owner", department: null });
  policyCreate.mockResolvedValue({ id: "sp-1", organizationId: "org-1" });
  policyUpsert.mockResolvedValue({ id: "sp-1", organizationId: "org-1" });
  teamCreate.mockResolvedValue({ id: "team-1", organizationId: "org-1", name: "Eng" });
  teamFindFirst.mockResolvedValue({ id: "team-1", organizationId: "org-1" });
  wsFindFirst.mockResolvedValue({ id: "ws-1", userId: "user-1" });
  wsUpdate.mockResolvedValue({ id: "ws-1", organizationId: "org-1", teamId: "team-1" });
});

// --- SecurityPolicyService --------------------------------------------

describe("SecurityPolicyService (pure evaluation)", () => {
  const policy = {
    minPasswordLength: 10,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: true,
  };

  it("accepts a password meeting every rule", () => {
    expect(securityPolicyService.evaluatePassword(policy, "Abcdef123!")).toEqual([]);
  });

  it("reports each violated rule", () => {
    const errors = securityPolicyService.evaluatePassword(policy, "short");
    expect(errors).toContain("At least 10 characters");
    expect(errors).toContain("At least one uppercase letter");
    expect(errors).toContain("At least one number");
    expect(errors).toContain("At least one symbol");
  });

  it("treats symbol requirement as optional when disabled", () => {
    const relaxed = { ...policy, requireSymbol: false };
    expect(securityPolicyService.evaluatePassword(relaxed, "Abcdef1234")).toEqual([]);
  });

  it("flags a session older than the policy timeout", () => {
    const now = new Date("2026-08-06T12:00:00Z");
    const active = new Date("2026-08-06T11:30:00Z"); // 30 min ago — 60min timeout
    const stale = new Date("2026-08-06T10:30:00Z"); // 90 min ago
    expect(securityPolicyService.isSessionExpired({ sessionTimeoutMinutes: 60 }, active, now)).toBe(false);
    expect(securityPolicyService.isSessionExpired({ sessionTimeoutMinutes: 60 }, stale, now)).toBe(true);
  });

  it("allows every IP when the allowlist is empty, blocks otherwise", () => {
    expect(securityPolicyService.isIpAllowed({ ipAllowlist: [] }, "203.0.113.9")).toBe(true);
    expect(securityPolicyService.isIpAllowed({ ipAllowlist: ["203.0.113.10"] }, "203.0.113.10")).toBe(true);
    expect(securityPolicyService.isIpAllowed({ ipAllowlist: ["203.0.113.10"] }, "198.51.100.1")).toBe(false);
  });

  it("matches CIDR ranges in the IP allowlist", () => {
    expect(securityPolicyService.isIpAllowed({ ipAllowlist: ["203.0.113.0/24"] }, "203.0.113.42")).toBe(true);
    expect(securityPolicyService.isIpAllowed({ ipAllowlist: ["203.0.113.0/24"] }, "203.0.114.1")).toBe(false);
    expect(securityPolicyService.isIpAllowed({ ipAllowlist: ["198.51.100.7/32"] }, "198.51.100.7")).toBe(true);
    expect(securityPolicyService.isIpAllowed({ ipAllowlist: ["10.0.0.0/8"] }, "10.1.2.3")).toBe(true);
  });
});

// --- SSO config (OrganizationService pure helpers) ---------------------

describe("OrganizationService SSO (parse + domain enforcement)", () => {
  it("returns defaults for empty/missing config", () => {
    expect(parseSsoConfig(undefined)).toEqual(DEFAULT_SSO_CONFIG);
    expect(parseSsoConfig({})).toEqual(DEFAULT_SSO_CONFIG);
  });

  it("parses a fully-configured SSO payload", () => {
    const cfg = parseSsoConfig({
      enforced: true,
      providers: [
        { provider: "google_workspace", enabled: true, domains: ["acme.com"] },
        { provider: "okta", enabled: false, domains: [] },
      ],
      samlMetadataUrl: "https://acme.okta.com/metadata",
    });
    expect(cfg.enforced).toBe(true);
    expect(cfg.providers[0].domains).toEqual(["acme.com"]);
    expect(cfg.samlMetadataUrl).toBe("https://acme.okta.com/metadata");
  });

  it("allows any domain when no provider is enabled (SSO not configured)", () => {
    const cfg = { ...DEFAULT_SSO_CONFIG, enforced: false, providers: DEFAULT_SSO_CONFIG.providers.map((p) => ({ ...p, enabled: false })) };
    expect(isDomainAllowedBySso(cfg, "dev@acme.com")).toBe(true);
  });

  it("does not lock everyone out when an enabled provider has no domains yet", () => {
    const cfg = parseSsoConfig({
      enforced: true,
      providers: [{ provider: "google_workspace", enabled: true, domains: [] }],
    });
    expect(isDomainAllowedBySso(cfg, "anyone@example.com")).toBe(true);
  });

  it("blocks domains outside the enabled provider allowlist", () => {
    const cfg = parseSsoConfig({
      enforced: true,
      providers: [{ provider: "google_workspace", enabled: true, domains: ["acme.com"] }],
    });
    expect(isDomainAllowedBySso(cfg, "dev@acme.com")).toBe(true);
    expect(isDomainAllowedBySso(cfg, "outsider@gmail.com")).toBe(false);
  });

  it("is case-insensitive on domains", () => {
    const cfg = parseSsoConfig({
      enforced: true,
      providers: [{ provider: "okta", enabled: true, domains: ["Acme.COM"] }],
    });
    expect(isDomainAllowedBySso(cfg, "Dev@acme.com")).toBe(true);
  });
});

// --- Branding (white-label) --------------------------------------------

describe("branding (white-label)", () => {
  it("returns safe defaults for missing branding", () => {
    expect(parseBranding(undefined)).toEqual(DEFAULT_BRANDING);
    expect(parseBranding("garbage")).toEqual(DEFAULT_BRANDING);
  });

  it("parses a valid branding payload and normalizes colors", () => {
    const b = parseBranding({ primaryColor: "#6366F1", logoUrl: "https://cdn.x/logo.png" });
    expect(b.primaryColor).toBe("#6366F1");
    expect(b.logoUrl).toBe("https://cdn.x/logo.png");
    expect(b.supportEmail).toBeNull();
  });

  it("normalizeHexColor accepts 6-digit hex and rejects everything else", () => {
    expect(normalizeHexColor("#abc123")).toBe("#ABC123");
    expect(normalizeHexColor("#abc")).toBeNull();
    expect(normalizeHexColor("red")).toBeNull();
    expect(normalizeHexColor(null)).toBeNull();
  });

  it("produces no CSS vars when no colors are set", () => {
    expect(brandingCssVars(DEFAULT_BRANDING)).toEqual({});
  });

  it("produces --primary/--ring (and --brand-accent) overrides from hex colors", () => {
    const vars = brandingCssVars({ primaryColor: "#6366F1", accentColor: "#10b981" });
    expect(vars["--primary"]).toBeTruthy();
    expect(vars["--ring"]).toBe(vars["--primary"]);
    expect(vars["--brand-accent"]).toBeTruthy();
    // HSL triple format: "H S% L%"
    expect(vars["--primary"]).toMatch(/^\d+ \d+% \d+%$/);
  });
});

// --- OrganizationService (mocked DB) -----------------------------------

describe("OrganizationService", () => {
  it("creates an org, adds the owner membership, and creates a default security policy", async () => {
    const org = await organizationService.createOrganization("user-1", { name: "Acme", slug: "ACME Corp!" });
    expect(org.id).toBe("org-1");
    expect(orgCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: "acme-corp" }) })
    );
    expect(memberCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "owner", userId: "user-1" }) })
    );
    expect(policyCreate).toHaveBeenCalledWith({ data: { organizationId: "org-1" } });
  });

  it("canManage is true for owner/admin and false otherwise", async () => {
    memberFindUnique.mockResolvedValueOnce({ role: "owner", department: null });
    expect(await organizationService.canManage("org-1", "user-1")).toBe(true);
    memberFindUnique.mockResolvedValueOnce({ role: "admin", department: null });
    expect(await organizationService.canManage("org-1", "user-1")).toBe(true);
    memberFindUnique.mockResolvedValueOnce({ role: "member", department: null });
    expect(await organizationService.canManage("org-1", "user-1")).toBe(false);
  });

  it("adds a member via upsert with the requested role", async () => {
    memberUpsert.mockResolvedValue({ id: "m-2", role: "manager", department: "Eng" });
    const member = await organizationService.addMember("org-1", "user-1", {
      userId: "user-2",
      role: "manager",
      department: "Eng",
    });
    expect(member?.role).toBe("manager");
    expect(memberUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ role: "manager", department: "Eng" }) })
    );
  });

  it("refuses to let a non-owner grant the owner role (escalation guard)", async () => {
    // Actor is an admin (canManage true) but NOT owner.
    memberFindUnique
      .mockResolvedValueOnce({ role: "admin", department: null }) // canManage → getMembership
      .mockResolvedValueOnce({ role: "admin", department: null }); // addMember escalation check
    const member = await organizationService.addMember("org-1", "user-1", {
      userId: "user-2",
      role: "owner",
    });
    expect(member).toBeNull();
    expect(memberUpsert).not.toHaveBeenCalled();
  });

  it("refuses admin self-promotion to owner via updateMemberRole", async () => {
    memberFindUnique
      .mockResolvedValueOnce({ role: "admin", department: null }) // canManage
      .mockResolvedValueOnce({ role: "admin", department: null }); // escalation check (actor)
    const result = await organizationService.updateMemberRole("org-1", "user-1", "user-1", "owner");
    expect(result).toBeNull();
  });

  it("lets the owner grant the owner role", async () => {
    memberFindUnique
      .mockResolvedValueOnce({ role: "owner", department: null }) // canManage
      .mockResolvedValueOnce({ role: "owner", department: null }); // escalation check (actor)
    const result = await organizationService.updateMemberRole("org-1", "user-1", "user-2", "owner");
    expect(result).not.toBeNull();
  });

  it("assigns a workspace the user owns to a team in the org", async () => {
    const ws = await organizationService.assignWorkspace("org-1", "user-1", "ws-1", "team-1");
    expect(ws?.teamId).toBe("team-1");
    expect(wsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "ws-1" }, data: expect.objectContaining({ organizationId: "org-1", teamId: "team-1" }) })
    );
  });

  it("refuses workspace assignment when the user owns neither the workspace nor the org", async () => {
    wsFindFirst.mockResolvedValueOnce(null);
    const result = await organizationService.assignWorkspace("org-1", "user-1", "ws-other", "team-1");
    expect(result).toBeNull();
    expect(wsUpdate).not.toHaveBeenCalled();
  });
});
