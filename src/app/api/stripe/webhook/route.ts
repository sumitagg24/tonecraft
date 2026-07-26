import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-06-24.dahlia",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (err) {
    console.error("Webhook signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // Retrieve subscription to get priceId and userId from metadata
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      const userId = subscription.metadata?.userId;

      if (!userId) {
        console.error("Webhook: subscription missing userId metadata:", subscription.id);
        break;
      }

      const subData = subscription as unknown as {
        current_period_start: number;
        current_period_end: number;
        cancel_at_period_end: boolean;
      };

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status: subscription.status,
          plan: "pro",
          currentPeriodStart: new Date(subData.current_period_start * 1000),
          currentPeriodEnd: new Date(subData.current_period_end * 1000),
          cancelAtPeriodEnd: subData.cancel_at_period_end,
        },
        update: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status: subscription.status,
          plan: "pro",
          currentPeriodStart: new Date(subData.current_period_start * 1000),
          currentPeriodEnd: new Date(subData.current_period_end * 1000),
          cancelAtPeriodEnd: subData.cancel_at_period_end,
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (!userId) {
        console.error("Webhook: subscription.updated missing userId metadata:", sub.id);
        break;
      }
      const subUpdateData = sub as unknown as {
        current_period_start: number;
        current_period_end: number;
        cancel_at_period_end: boolean;
      };
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: sub.status,
          currentPeriodStart: new Date(subUpdateData.current_period_start * 1000),
          currentPeriodEnd: new Date(subUpdateData.current_period_end * 1000),
          cancelAtPeriodEnd: subUpdateData.cancel_at_period_end,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (!userId) {
        console.error("Webhook: subscription.deleted missing userId metadata:", sub.id);
        break;
      }
      await prisma.subscription.updateMany({
        where: { userId },
        data: {
          status: "canceled",
          plan: "free",
          stripeSubscriptionId: null,
          stripePriceId: null,
        },
      });
      break;
    }

    default:
      // Unhandled event types — acknowledge without processing
      break;
  }

  return NextResponse.json({ received: true });
}
