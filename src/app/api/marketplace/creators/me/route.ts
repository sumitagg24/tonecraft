import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { marketplaceService } from "@/services/MarketplaceService";
import { z } from "zod";

const profileSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(300).nullable().optional(),
  location: z.string().max(80).nullable().optional(),
  website: z.string().max(200).nullable().optional(),
});

const api = withApiHandler({ feature: "marketplace" });

// GET /api/marketplace/creators/me
export const GET = api.GET(async (ctx) => {
  const data = await marketplaceService.myProfile(ctx.user.id);
  return ok(data);
});

// PATCH /api/marketplace/creators/me
export const PATCH = api.PATCH(async (ctx, body) => {
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const profile = await marketplaceService.updateProfile(ctx.user.id, parsed.data);
  if (!profile) return fail("HANDLE_TAKEN", "That handle is already taken", 409);
  return ok(profile);
});
