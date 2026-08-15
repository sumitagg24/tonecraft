import { NextRequest, NextResponse } from "next/server";
import { guardCronRequest } from "@/lib/cron-guard";
import { optimizeCollaborationStorage } from "@/lib/socket-storage";

/**
 * Global collaboration-storage cleanup (deletes stale presence/typing rows,
 * sessions and auto snapshots across every tenant), so it is a maintenance
 * worker rather than a user action: authenticated by CRON_SECRET, not a session.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const guarded = guardCronRequest(req);
  if (guarded) return guarded;

  const result = await optimizeCollaborationStorage();
  return NextResponse.json({ success: true, data: result });
}
