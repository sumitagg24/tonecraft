export function contextBlock(ctx: {
  platform?: string;
  length?: string;
  formality?: string;
  creativity?: number;
  emojiLevel?: number;
  audience?: string;
  language?: string;
}): string {
  const parts: string[] = [];
  if (ctx.platform) parts.push(`Platform: ${ctx.platform}`);
  if (ctx.audience) parts.push(`Target Audience: ${ctx.audience}`);
  if (ctx.length) parts.push(`Desired Length: ${ctx.length}`);
  if (ctx.formality) parts.push(`Formality Level: ${ctx.formality}`);
  if (ctx.creativity !== undefined && ctx.creativity >= 0) parts.push(`Creativity Level: ${ctx.creativity}/100 (0=strict, 100=wild)`);
  if (ctx.emojiLevel !== undefined && ctx.emojiLevel > 0) parts.push(`Emoji Level: ${ctx.emojiLevel}/10`);
  if (ctx.language) parts.push(`Language: ${ctx.language}`);
  return parts.length ? `\n\nContext:\n${parts.join("\n")}` : "";
}
