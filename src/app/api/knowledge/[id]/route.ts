import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { knowledgeService } from "@/services/KnowledgeService";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const file = await knowledgeService.findByIdAndUser(id, session.user.id);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(file);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const name = body.name as string | undefined;
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  await knowledgeService.rename(id, session.user.id, name.trim());
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await prisma.knowledgeChunk.deleteMany({ where: { file: { id, userId: session.user.id } } });
  const removed = await knowledgeService.remove(id, session.user.id);
  if (removed.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  void result;
  return NextResponse.json({ success: true });
}
