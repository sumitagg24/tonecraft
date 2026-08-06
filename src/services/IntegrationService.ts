import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const INTEGRATION_SERVICES = [
  "google_drive",
  "notion",
  "github",
  "slack",
  "discord",
  "gmail",
  "calendar",
] as const;

export type IntegrationServiceName = (typeof INTEGRATION_SERVICES)[number];

const SCOPES: Record<IntegrationServiceName, string[]> = {
  google_drive: ["drive.readonly"],
  notion: ["content.read", "content.write"],
  github: ["repo", "read:user"],
  slack: ["chat:write", "files:write"],
  discord: ["guilds", "messages"],
  gmail: ["mail.readonly", "mail.send"],
  calendar: ["calendar.read", "calendar.write"],
};

export class IntegrationService {
  async list(userId: string) {
    // Ensure every service has a row so the UI always shows the full set.
    await Promise.all(
      INTEGRATION_SERVICES.map((service) =>
        prisma.integration.upsert({
          where: { userId_service: { userId, service } },
          create: { userId, service, status: "not_connected" },
          update: {},
        })
      )
    );
    return prisma.integration.findMany({
      where: { userId },
      orderBy: { service: "asc" },
    });
  }

  /**
   * Simulated connect — used for services without OAuth credentials configured
   * (and as a dev fallback). Real flows go through /api/integrations/[id]/auth
   * and complete via completeOAuth().
   */
  async connect(userId: string, service: IntegrationServiceName) {
    const config: Prisma.InputJsonValue = {
      mock: true,
      scopes: SCOPES[service],
      account: `you@${service === "calendar" || service === "gmail" || service === "google_drive" ? "gmail.com" : service.replace("_", ".com")}`,
    };
    return prisma.integration.upsert({
      where: { userId_service: { userId, service } },
      create: {
        userId,
        service,
        status: "connected",
        config,
        connectedAt: new Date(),
      },
      update: {
        status: "connected",
        config,
        error: null,
        connectedAt: new Date(),
      },
    });
  }

  /**
   * Persist tokens returned by the OAuth callback. Called only from the callback
   * route after the provider exchanged the code. Note: tokens are stored in the
   * DB as-is; encrypt at rest before production deployment.
   */
  async completeOAuth(
    userId: string,
    service: IntegrationServiceName,
    tokens: {
      accessToken: string;
      refreshToken?: string | null;
      scope?: string;
      expiresAt?: string | null;
      account?: string;
      team?: string | null;
    }
  ) {
    const config: Prisma.InputJsonValue = {
      oauth: true,
      mock: false,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
      scope: tokens.scope ?? SCOPES[service].join(" "),
      expiresAt: tokens.expiresAt ?? null,
      account: tokens.account ?? null,
      team: tokens.team ?? null,
    };
    return prisma.integration.upsert({
      where: { userId_service: { userId, service } },
      create: {
        userId,
        service,
        status: "connected",
        config,
        connectedAt: new Date(),
      },
      update: {
        status: "connected",
        config,
        error: null,
        connectedAt: new Date(),
      },
    });
  }

  async disconnect(userId: string, service: IntegrationServiceName) {
    return prisma.integration.updateMany({
      where: { userId, service },
      data: { status: "not_connected", config: Prisma.JsonNull, connectedAt: null, error: null },
    });
  }

  async setStatus(
    userId: string,
    service: IntegrationServiceName,
    status: string,
    error?: string | null
  ) {
    return prisma.integration.updateMany({
      where: { userId, service },
      data: { status, error: error ?? null },
    });
  }
}

export const integrationService = new IntegrationService();
