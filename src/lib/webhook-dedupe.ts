import { prisma } from "@/lib/prisma";

/**
 * Webhook replay protection.
 *
 * Claim pattern: `claimWebhookEvent` inserts (provider, eventId) and reports
 * whether this delivery should be processed. A row that already exists with
 * `processed = true` is a replay → "duplicate". A row that exists with
 * `processed = false` is a retry of a crashed attempt → "retry" (re-run; the
 * downstream syncs are idempotent via upsert). A fresh insert → "new".
 *
 * Callers must invoke `markWebhookProcessed` after the handler succeeds; if
 * the handler throws, the claim stays unprocessed and the provider's retry
 * will be allowed through.
 */
export type ClaimResult = "new" | "retry" | "duplicate";

export async function claimWebhookEvent(
  provider: "paddle" | "clerk",
  eventId: string,
  type?: string | null
): Promise<ClaimResult> {
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider, eventId } },
    select: { processed: true },
  });
  if (existing?.processed) return "duplicate";

  await prisma.webhookEvent.upsert({
    where: { provider_eventId: { provider, eventId } },
    create: { provider, eventId, type: type ?? null },
    update: { type: type ?? undefined }, // keep processed=false so retries re-run
  });
  return existing ? "retry" : "new";
}

export async function markWebhookProcessed(
  provider: "paddle" | "clerk",
  eventId: string
): Promise<void> {
  await prisma.webhookEvent.updateMany({
    where: { provider, eventId },
    data: { processed: true, processedAt: new Date() },
  });
}
