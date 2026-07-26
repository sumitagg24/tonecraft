import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { messageService } from "@/services/MessageService";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const message = await messageService.regenerateMessage(messageId, session.user.id);
    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to regenerate" }, { status: 400 });
  }
}
