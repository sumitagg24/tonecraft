import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { knowledgeService } from "@/services/KnowledgeService";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = req.nextUrl.searchParams.get("projectId") || null;
  const files = await knowledgeService.list(session.user.id, projectId);
  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = (formData.get("projectId") as string | null) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const created = await knowledgeService.create(session.user.id, file.name, buffer, projectId);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
