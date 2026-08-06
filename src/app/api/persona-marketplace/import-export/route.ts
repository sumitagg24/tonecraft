import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { personaMarketplaceService } from "@/services/PersonaService";
import { personaImportExportSchema } from "@/lib/validators";

const api = withApiHandler({ schema: personaImportExportSchema });

export const POST = api.POST(async (ctx, body) => {
  const { importData, exportIds } = body as {
    importData?: {
      name: string;
      description?: string;
      systemPrompt: string;
      icon?: string;
      color?: string;
      isDefault?: boolean;
      isFavorite?: boolean;
      projectId?: string;
    };
    exportIds?: string[];
  };

  if (importData) {
    const persona = await personaMarketplaceService.importPersona(ctx.user.id, importData);
    return ok(persona, 201);
  }

  if (exportIds) {
    const exported = await Promise.all(
      exportIds.map((id) => personaMarketplaceService.exportPersona(id, ctx.user.id))
    );
    return ok({ exported: exported.filter(Boolean) });
  }

  return fail("VALIDATION_ERROR", "No import data or export IDs provided", 400);
});