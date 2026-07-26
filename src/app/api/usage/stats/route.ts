import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { usageService } from "@/services/UsageService";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await usageService.getStats(session.user.id);
  return NextResponse.json(stats);
}
