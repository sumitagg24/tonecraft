import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { messageRepository } from "@/repositories/MessageRepository";
import { z } from "zod";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const schema = z.object({ content: z.string().min(1) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await messageRepository.update(messageId, {
    content: parsed.data.content,
    isEdited: true,
    editedAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await messageRepository.findById(messageId);
  await (await import("@/lib/prisma")).prisma.message.delete({ where: { id: messageId } });
  return NextResponse.json({ success: true });
}
