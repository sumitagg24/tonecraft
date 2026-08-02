import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { promptService } from "@/services/PromptService";
import { z } from "zod";

const schema = z.object({
  content: z.string().min(1).max(10000),
  variables: z.record(z.string(), z.string().max(2000)).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const rendered = promptService.renderTemplate(parsed.data.content, parsed.data.variables || {});
  return NextResponse.json({ rendered });
}
