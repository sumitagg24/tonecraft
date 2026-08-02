import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { knowledgeService } from "@/services/KnowledgeService";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const query = body.query as string | undefined;
  const fileIds = body.fileIds as string[] | undefined;
  if (!query || !query.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }
  const chunks = await knowledgeService.retrieve(session.user.id, query, fileIds);
  return NextResponse.json({ chunks });
}
