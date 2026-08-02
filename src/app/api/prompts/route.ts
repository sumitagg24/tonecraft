import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { promptService } from "@/services/PromptService";
import { z } from "zod";

const variableSchema = z.object({
  name: z.string().min(1).max(50),
  label: z.string().max(100).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string().max(200)).max(50).optional(),
});

const promptSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  content: z.string().min(1).max(10000),
  category: z.string().max(50).optional(),
  variables: z.array(variableSchema).max(50).optional(),
  projectId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
  const prompts = await promptService.listPrompts(session.user.id, projectId);
  const categories = await promptService.listCategories(session.user.id);
  return NextResponse.json({ prompts, categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = promptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const prompt = await promptService.createPrompt(session.user.id, parsed.data);
  return NextResponse.json(prompt, { status: 201 });
}
