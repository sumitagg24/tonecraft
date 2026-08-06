import { ok, withApiHandler } from "@/lib/withApiHandler";
import { integrationService } from "@/services/IntegrationService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const integrations = await integrationService.list(ctx.user.id);
  return ok(integrations);
});
