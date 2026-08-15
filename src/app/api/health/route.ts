import { NextResponse } from "next/server";
import { providerHealthService, type HealthReport } from "@/services/ProviderHealthService";
import { logger } from "@/lib/logger";

const PROVIDER_NAMES = ["database", "groq", "gemini", "openrouter", "clerk", "paddle"] as const;

/**
 * Public liveness endpoint.
 * - No `force` param (audit 12 P2.6): real upstream probes are internal-only.
 * - Sanitized payload (audit 12 P1.2): provider error text is never exposed.
 */
export async function GET() {
  let report: HealthReport;
  try {
    report = await providerHealthService.checkAll(false);
  } catch (error) {
    logger.error(
      "[health] provider health check failed — reporting offline",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
    report = {
      status: "offline",
      providers: {},
      checkedAt: new Date(),
    };
    for (const name of PROVIDER_NAMES) {
      report.providers[name] = {
        name,
        status: "offline",
        lastChecked: new Date(),
        error: "Health check system error",
      };
    }
  }

  const sanitized = {
    status: report.status,
    checkedAt: report.checkedAt,
    providers: Object.fromEntries(
      Object.entries(report.providers).map(([name, p]) => [
        name,
        {
          name: p.name,
          status: p.status,
          lastChecked: p.lastChecked,
        },
      ]),
    ),
  };

  return NextResponse.json(sanitized, { status: report.status === "offline" ? 503 : 200 });
}
