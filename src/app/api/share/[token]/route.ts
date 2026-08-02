import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const share = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      chat: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: { id: true, role: true, content: true, createdAt: true, model: true },
          },
        },
      },
    },
  });

  if (!share || share.revoked) {
    return NextResponse.json({ error: "Link not found or revoked" }, { status: 404 });
  }
  if (share.expiresAt && share.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link has expired" }, { status: 410 });
  }

  return NextResponse.json({
    token: share.token,
    createdAt: share.createdAt,
    chat: share.chat ? {
      id: share.chat.id,
      title: share.chat.title,
      messages: share.chat.messages,
    } : null,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  await prisma.shareLink.updateMany({ where: { token }, data: { revoked: true } });
  return NextResponse.json({ success: true });
}
