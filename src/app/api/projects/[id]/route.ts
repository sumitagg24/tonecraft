import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { projectService } from "@/services/ProjectService";
import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const EMOJI_RE = /^[\p{Emoji}\p{Emoji_Presentation}\s]{0,10}$/u;

const projectSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  emoji: z.string().refine((v) => !v || EMOJI_RE.test(v), "Emoji must be a single emoji or empty").optional(),
  color: z.string().refine((v) => !v || HEX_COLOR.test(v), "Color must be a valid hex color").optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().nullable().optional(),
  archived: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const project = await projectService.getProject(id, session.user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const chats = await projectService.listProjectChats(id, session.user.id);
  return NextResponse.json({ project, chats });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const ok = await projectService.updateProject(id, session.user.id, parsed.data);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await projectService.deleteProject(id, session.user.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
