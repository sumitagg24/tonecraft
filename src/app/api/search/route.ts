import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchService } from "@/services/SearchService";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const query = req.nextUrl.searchParams.get("q") || "";
  const results = await searchService.search(session.user.id, query);
  return NextResponse.json(results);
}
