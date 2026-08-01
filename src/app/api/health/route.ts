import { NextResponse } from "next/server";
import { providerHealthService, type HealthReport } from "@/services/ProviderHealthService";

const PROVIDER_NAMES = ["database", "groq", "gemini", "openrouter", "clerk", "paddle"] as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  let report: HealthReport;
  try {
    report = await providerHealthService.checkAll(force);
  } catch {
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

  return NextResponse.json(report, { status: report.status === "offline" ? 503 : 200 });
}
