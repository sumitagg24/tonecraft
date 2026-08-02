import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { projectService } from "@/services/ProjectService";
import { z } from "zod";

const schema = z.object({
  title: z.string().max(200).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const chat = await projectService.createProjectChat(id, session.user.id, parsed.data);
    return NextResponse.json(chat, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 404 });
  }
}
