import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { projectService } from "@/services/ProjectService";
import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const EMOJI_RE = /^[\p{Emoji}\p{Emoji_Presentation}\s]{0,10}$/u;

const projectSchema = z.object({
  name: z.string().min(1).max(80),
  emoji: z.string().refine((v) => !v || EMOJI_RE.test(v), "Emoji must be a single emoji or empty").optional(),
  color: z.string().refine((v) => !v || HEX_COLOR.test(v), "Color must be a valid hex color").optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const includeArchived = false;
  const projects = await projectService.listProjects(session.user.id, includeArchived);
  const unfiled = await projectService.getUnfiledCount(session.user.id);
  return NextResponse.json({ projects, unfiled });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const project = await projectService.createProject(session.user.id, parsed.data);
  return NextResponse.json(project, { status: 201 });
}
