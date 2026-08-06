import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { auditLogService } from "@/services/AuditLogService";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not set" }, { status: 500 });
  }

  const body = await req.text();
  const heads = await headers();
  const svixId = heads.get("svix-id");
  const svixTimestamp = heads.get("svix-timestamp");
  const svixSignature = heads.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const wh = new Webhook(webhookSecret);
  let evt: { type: string; data: Record<string, unknown> };

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const id = evt.data.id as string;
    const emailAddresses = evt.data.email_addresses as { email_address: string }[] | undefined;
    const firstName = evt.data.first_name as string | undefined;
    const lastName = evt.data.last_name as string | undefined;
    const imageUrl = evt.data.image_url as string | undefined;

    const email = emailAddresses?.[0]?.email_address;
    const name = [firstName, lastName].filter(Boolean).join(" ") || null;

    // Upsert: lazy sync may have created user with empty email
    const user = await prisma.user.upsert({
      where: { clerkId: id },
      create: {
        clerkId: id,
        email: email || "",
        name,
        image: imageUrl || null,
      },
      update: {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
        ...(imageUrl ? { image: imageUrl } : {}),
      },
    });

    if (evt.type === "user.created") {
      void auditLogService.record("auth.sign_up", "user", {
        actorId: user.id,
        resourceId: user.id,
        metadata: { email, source: "clerk.webhook" },
      });
    }
  }

  if (evt.type === "user.deleted") {
    const id = evt.data.id as string;
    const user = await prisma.user.findUnique({
      where: { clerkId: id },
      select: { id: true },
    });
    if (user) {
      void auditLogService.record("auth.sign_out", "user", {
        actorId: user.id,
        resourceId: user.id,
        metadata: { reason: "account_deleted" },
      });
    }
    await prisma.user.deleteMany({ where: { clerkId: id } });
  }

  return NextResponse.json({ received: true });
}
