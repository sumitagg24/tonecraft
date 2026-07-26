import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { chatService } from "@/services/ChatService";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const chats = await chatService.listChats(session.user.id);
  return NextResponse.json(chats);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let data: { title?: string; tone?: string; platform?: string; language?: string } = {};
  try { data = await req.json(); } catch { /* ignore */ }
  const chat = await chatService.createChat(session.user.id, data);
  return NextResponse.json(chat, { status: 201 });
}
