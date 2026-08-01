import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ApiError } from "@paddle/paddle-node-sdk";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  Pro: process.env.PADDLE_PRICE_PRO ?? "pri_01kyn5577vywxh8z8b40h96ka5",
  Enterprise: process.env.PADDLE_PRICE_ENTERPRISE ?? "pri_01kyn5rt66qd17jq4b67v85j6v",
};

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan?: string };
    if (!plan || !PLAN_PRICE_MAP[plan]) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const priceId = PLAN_PRICE_MAP[plan];

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true, name: true, subscription: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (user.subscription?.status === "active" || user.subscription?.status === "trialing") {
      return NextResponse.json({ error: "Subscription already active." }, { status: 409 });
    }

    let customerId = user.subscription?.providerCustomerId;
    if (!customerId) {
      const result = await billingService.createCustomer({
        email: user.email ?? "",
        name: user.name ?? undefined,
        userId: user.id,
      });
      customerId = result.customerId;
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          paymentProvider: "paddle",
          providerCustomerId: customerId,
          plan: plan.toLowerCase(),
          status: "incomplete",
        },
        update: { providerCustomerId: customerId },
      });
    }

    const checkout = await billingService.createCheckout({
      priceId,
      userId: user.id,
      customerId,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { plan: plan.toLowerCase() },
    });

    logger.info("Checkout created", { userId: user.id, plan });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.retryAfter != null) {
        logger.error("Paddle rate limited", { detail: err.detail, retryAfter: err.retryAfter });
        return NextResponse.json(
          { error: "Paddle temporarily rate limited." },
          { status: 429 }
        );
      }
      logger.error("Paddle API error", { code: err.code, detail: err.detail });
      return NextResponse.json(
        { error: "Billing provider unavailable." },
        { status: 503 }
      );
    }
    logger.error("Unexpected checkout error", { error: String(err) });
    return NextResponse.json(
      { error: "Unexpected billing error." },
      { status: 500 }
    );
  }
}