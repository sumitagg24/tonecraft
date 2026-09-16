import { Webhooks } from "@dodopayments/nextjs";
import type { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { auditLogService } from "@/services/AuditLogService";
import { claimWebhookEvent, markWebhookProcessed } from "@/lib/webhook-dedupe";
import {
  eventIdOf,
  syncSubscriptionFromDodo,
  asString,
  unwrap,
  type Raw,
} from "@/billing/dodoWebhook";

/**
 * POST /api/webhooks/dodo — receive Dodo Payments webhook events.
 *
 * ⚠️ Dodo dashboard webhook URL MUST use the canonical, non-redirecting host:
 *        https://www.tonecraft.site/api/webhooks/dodo
 *   The apex host (https://tonecraft.site/api/webhooks/dodo) 308-redirects to
 *   www at the Vercel platform level; webhook senders that follow the redirect
 *   typically drop the signature headers (or fail outright), so events would
 *   never be verified and subscriptions would never activate.
 *
 * Signature verification (Svix Standard Webhook: webhook-id /
 * webhook-timestamp / webhook-signature) is performed by the
 * @dodopayments/nextjs Webhooks helper before any handler runs.
 *
 * Payload envelope: { type, business_id, timestamp, data: <Subscription|Payment> }
 * Resource fields live under `data` — helpers normalize with `unwrap()`.
 */

let webhookHandler: ((req: NextRequest) => Promise<NextResponse<unknown>>) | undefined;

function getWebhookHandler() {
  if (!webhookHandler) {
    const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    if (!webhookKey) {
      throw new Error(
        "DODO_PAYMENTS_WEBHOOK_KEY is not configured. " +
        "Webhook verification cannot proceed without it."
      );
    }
    webhookHandler = Webhooks({
      webhookKey,

      onPayload: async (payload) => {
        const p = payload as Raw;
        const eventId = eventIdOf(p);

        const claim = eventId
          ? await claimWebhookEvent("dodo", eventId, asString(p.type))
          : "new";
        if (claim === "duplicate") {
          logger.info("Dodo webhook replay skipped", { eventId, type: p.type });
          return;
        }

        logger.info("Dodo webhook received", { type: p.type, eventId });
        void auditLogService.record("billing.webhook_received", "billing", {
          metadata: { eventType: p.type, provider: "dodo" },
        });

        // markWebhookProcessed is called AFTER event handlers succeed so the
        // event is only marked done once it has actually been processed.
      },

      onPaymentSucceeded: async (payload) => {
        const p = payload as Raw;
        logger.info("Dodo payment succeeded", { eventId: eventIdOf(p) });
        await syncSubscriptionFromDodo(p, "active", { createOnlyWhenPlanKnown: true });
        await markProcessed(p);
      },

      onPaymentFailed: async (payload) => {
        const p = payload as Raw;
        logger.warn("Dodo payment failed", { eventId: eventIdOf(p) });
        // Sync subscription to past_due so the access gate shows the right state.
        await syncSubscriptionFromDodo(p, "past_due", { createOnlyWhenPlanKnown: true });
        await markProcessed(p);
      },

      onPaymentProcessing: async (payload) => {
        // No status transition — payment is still in flight.
        await markProcessed(payload as Raw);
      },

      onPaymentCancelled: async (payload) => {
        // Customer abandoned / cancelled the payment attempt — subscription
        // state is unchanged, so there is nothing to sync.
        await markProcessed(payload as Raw);
      },

      onSubscriptionActive: async (payload) => {
        const p = payload as Raw;
        await syncSubscriptionFromDodo(p, "active");
        await markProcessed(p);
      },

      onSubscriptionCancelled: async (payload) => {
        const p = payload as Raw;
        await syncSubscriptionFromDodo(p, "canceled");
        await markProcessed(p);
      },

      onSubscriptionOnHold: async (payload) => {
        const p = payload as Raw;
        await syncSubscriptionFromDodo(p, "past_due");
        await markProcessed(p);
      },

      onSubscriptionPaused: async (payload) => {
        const p = payload as Raw;
        await syncSubscriptionFromDodo(p, "paused");
        await markProcessed(p);
      },

      onSubscriptionUnpaused: async (payload) => {
        const p = payload as Raw;
        await syncSubscriptionFromDodo(p, "active");
        await markProcessed(p);
      },

      onSubscriptionRenewed: async (payload) => {
        const p = payload as Raw;
        await syncSubscriptionFromDodo(p, "active");
        await markProcessed(p);
      },

      onSubscriptionPlanChanged: async (payload) => {
        const p = payload as Raw;
        await syncSubscriptionFromDodo(p, "active");
        await markProcessed(p);
      },

      onSubscriptionFailed: async (payload) => {
        const p = payload as Raw;
        await syncSubscriptionFromDodo(p, "past_due");
        await markProcessed(p);
      },

      onSubscriptionExpired: async (payload) => {
        const p = payload as Raw;
        await syncSubscriptionFromDodo(p, "canceled");
        await markProcessed(p);
      },

      /**
       * subscription.updated carries the authoritative current status in
       * `data.status` — map it instead of hardcoding "active".
       */
      onSubscriptionUpdated: async (payload) => {
        const p = payload as Raw;
        const providerStatus = asString(unwrap(p).status);
        await syncSubscriptionFromDodo(p, dodoStatusToLocal(providerStatus));
        await markProcessed(p);
      },
    });
  }
  return webhookHandler;
}

export const POST = (req: NextRequest) => getWebhookHandler()(req);

/** Map Dodo subscription statuses to local access-gate statuses. */
function dodoStatusToLocal(providerStatus: string): string {
  switch (providerStatus) {
    case "paused":
      return "paused";
    case "cancelled":
      return "canceled";
    case "failed":
    case "on_hold":
      return "past_due";
    case "expired":
      return "canceled";
    case "pending":
      return "trialing";
    default:
      return "active";
  }
}

async function markProcessed(payload: Raw) {
  const eventId = eventIdOf(payload);
  if (eventId) {
    try {
      await markWebhookProcessed("dodo", eventId);
    } catch (err) {
      logger.error("Failed to mark webhook processed", { error: String(err) });
    }
  }
}