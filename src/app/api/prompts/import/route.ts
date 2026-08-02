import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { promptRepository } from "@/repositories/PromptRepository";
import { z } from "zod";

const importSchema = z.object({
  prompts: z.array(z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    content: z.string().min(1).max(10000),
    category: z.string().max(50).optional(),
    variables: z.array(z.object({
      name: z.string().min(1).max(50),
      label: z.string().max(100).optional(),
      required: z.boolean().optional(),
      options: z.array(z.string().max(200)).max(50).optional(),
    })).max(50).optional(),
  })).min(1).max(500),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const created = [];
  for (const prompt of parsed.data.prompts) {
    created.push(await promptRepository.create({
      userId: session.user.id,
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      variables: prompt.variables,
    }));
  }
  return NextResponse.json({ imported: created.length }, { status: 201 });
}
