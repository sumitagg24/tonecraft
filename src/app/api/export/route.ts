import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { chatRepository } from "@/repositories/ChatRepository";
import { serializeChat, MIME_BY_FORMAT } from "@/lib/export/serialize";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const chatId = body.chatId as string | undefined;
  const format = (body.format as string | undefined) ?? "md";

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }
  if (!MIME_BY_FORMAT[format]) {
    return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
  }

  const chat = await chatRepository.findByIdAndUser(chatId, session.user.id);
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const messages = chat.messages ?? [];
  const content = serializeChat(format, chat, messages);
  const filename = `${chat.title || "chat"}-${new Date().toISOString().slice(0, 10)}.${format}`;

  return NextResponse.json({ content, filename, mime: MIME_BY_FORMAT[format] });
}
