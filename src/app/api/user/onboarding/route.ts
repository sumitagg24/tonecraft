import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const onboardingSchema = z.object({
  writingType: z.string().min(1),
  language: z.string().min(1),
  tone: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { language, tone } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      preferredLanguage: language,
      defaultTone: tone,
    },
  });

  return NextResponse.json({ success: true });
}
