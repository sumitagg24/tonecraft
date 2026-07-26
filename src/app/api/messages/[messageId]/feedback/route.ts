import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { messageRepository } from "@/repositories/MessageRepository";
import { z } from "zod";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const schema = z.object({
    feedback: z.enum(["liked", "disliked"]).nullable(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await messageRepository.updateFeedback(messageId, parsed.data.feedback);
  if (!updated) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
