import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const chatId = body.chatId as string | undefined;
  const expiresInDays = body.expiresInDays as number | undefined;

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const chat = await prisma.chat.findFirst({ where: { id: chatId, userId: session.user.id }, select: { id: true } });
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const token = generateToken();
  const share = await prisma.shareLink.create({
    data: {
      token,
      userId: session.user.id,
      chatId,
      role: "viewer",
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null,
    },
  });

  const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/share/${token}`;
  return NextResponse.json({ url, token: share.token, expiresAt: share.expiresAt }, { status: 201 });
}
