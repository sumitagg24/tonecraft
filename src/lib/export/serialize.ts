import type { Chat, Message } from "@/types";
import { escapeHtml } from "@/lib/escape";

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function serializeChatMarkdown(chat: Chat, messages: Message[]): string {
  const lines: string[] = [];
  lines.push(`# ${chat.title || "Untitled chat"}`);
  lines.push("");
  lines.push(`*Exported ${fmtDate(new Date())} from ToneCraft*`);
  if (chat.tone || chat.platform) {
    lines.push("");
    lines.push(`**Settings:** ${[chat.tone, chat.platform].filter(Boolean).join(" · ")}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const m of messages) {
    if (m.role === "system") continue;
    const label = m.role === "user" ? "**You:**" : "**ToneCraft:**";
    lines.push(`${label}`);
    lines.push("");
    lines.push(m.content);
    if (m.attachments?.length) {
      lines.push("");
      lines.push(`*Attachments: ${m.attachments.map((a) => a.fileName).join(", ")}*`);
    }
    lines.push("");
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("*Generated with ToneCraft*");
  return lines.join("\n");
}

export function serializeChatTxt(chat: Chat, messages: Message[]): string {
  const lines: string[] = [];
  lines.push(chat.title || "Untitled chat");
  lines.push(`Exported ${fmtDate(new Date())} from ToneCraft`);
  lines.push("=".repeat(40));
  lines.push("");

  for (const m of messages) {
    if (m.role === "system") continue;
    const label = m.role === "user" ? "YOU" : "TONECRAFT";
    lines.push(`[${label} · ${fmtDate(m.createdAt)}]`);
    lines.push(m.content);
    lines.push("");
  }

  lines.push("=".repeat(40));
  lines.push("Generated with ToneCraft");
  return lines.join("\n");
}

export function serializeChatHtml(chat: Chat, messages: Message[]): string {
  const body = messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const cls = m.role === "user" ? "user" : "assistant";
      return `<div class="msg ${cls}"><div class="meta">${m.role === "user" ? "You" : "ToneCraft"} · ${fmtDate(m.createdAt)}</div><div class="body">${escapeHtml(m.content).replace(/\n/g, "<br/>")}</div></div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(chat.title || "Untitled chat")}</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 720px; margin: 0 auto; padding: 24px; color: #111; background: #fff; }
  h1 { font-size: 1.5rem; }
  .meta { font-size: 0.75rem; color: #666; margin-bottom: 6px; }
  .msg { margin-bottom: 16px; padding: 12px 16px; border-radius: 8px; }
  .msg.user { background: #f0f0f5; }
  .msg.assistant { background: #eef2ff; border-left: 3px solid #6366f1; }
  .body { white-space: pre-wrap; line-height: 1.5; }
  footer { margin-top: 24px; font-size: 0.75rem; color: #999; text-align: center; }
</style>
</head>
<body>
<h1>${escapeHtml(chat.title || "Untitled chat")}</h1>
<p class="meta">Exported ${fmtDate(new Date())} from ToneCraft</p>
${body}
<footer>Generated with ToneCraft</footer>
</body>
</html>`;
}

export function serializeChatJson(chat: Chat, messages: Message[]): string {
  return JSON.stringify(
    {
      title: chat.title,
      exportedAt: new Date().toISOString(),
      settings: { tone: chat.tone ?? null, platform: chat.platform ?? null },
      messages: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
          model: m.model ?? null,
          attachments: m.attachments?.map((a) => a.fileName) ?? [],
        })),
    },
    null,
    2
  );
}

export function serializeChat(format: string, chat: Chat, messages: Message[]): string {
  switch (format) {
    case "txt": return serializeChatTxt(chat, messages);
    case "html": return serializeChatHtml(chat, messages);
    case "json": return serializeChatJson(chat, messages);
    case "md":
    default: return serializeChatMarkdown(chat, messages);
  }
}

export const MIME_BY_FORMAT: Record<string, string> = {
  md: "text/markdown",
  txt: "text/plain",
  html: "text/html",
  json: "application/json",
};
