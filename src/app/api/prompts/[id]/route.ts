import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { promptService } from "@/services/PromptService";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  content: z.string().min(1).max(10000).optional(),
  category: z.string().max(50).optional(),
  variables: z.array(z.object({
    name: z.string().min(1).max(50),
    label: z.string().max(100).optional(),
    required: z.boolean().optional(),
    options: z.array(z.string().max(200)).max(50).optional(),
  })).max(50).optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  projectId: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const prompt = await promptService.getPrompt(id, session.user.id);
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prompt);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const ok = await promptService.updatePrompt(id, session.user.id, parsed.data);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ok = await promptService.deletePrompt(id, session.user.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
