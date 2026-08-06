import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { integrationService, type IntegrationServiceName } from "@/services/IntegrationService";
import { isOAuthConfigured } from "@/lib/integrations/oauth";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["connect", "disconnect"]),
});

const api = withApiHandler({ schema: actionSchema });

export const PATCH = api.PATCH(async (ctx, body) => {
  const { action } = body as typeof actionSchema._output;
  const service = ctx.params.id as IntegrationServiceName;

  const integrations = await integrationService.list(ctx.user.id);
  const target = integrations.find((i) => i.service === service);
  if (!target) return notFound();

  if (action === "connect") {
    if (isOAuthConfigured(service)) {
      // Real OAuth — the client follows the auth URL (provider consent screen).
      const authUrl = `${ctx.request.nextUrl.origin}/api/integrations/${service}/auth`;
      return ok({ oauth: true, authUrl });
    }
    const integration = await integrationService.connect(ctx.user.id, service);
    return ok(integration);
  }

  await integrationService.disconnect(ctx.user.id, service);
  const updated = integrations.find((i) => i.service === service);
  return ok({ ...updated, status: "not_connected", config: null, connectedAt: null });
});
