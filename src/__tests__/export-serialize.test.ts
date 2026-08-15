import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import {
  serializeChat,
  serializeChatHtml,
  serializeChatJson,
  serializeChatMarkdown,
  serializeChatTxt,
  MIME_BY_FORMAT,
} from "@/lib/export/serialize";
import type { Attachment, Chat, Message } from "@/types";

const CREATED_AT = new Date("2024-05-04T10:30:00Z");

function chat(overrides: Partial<Chat> = {}): Chat {
  return {
    id: "chat-1",
    userId: "user-1",
    title: "Launch copy",
    tone: "professional",
    model: "auto",
    platform: "linkedin",
    language: null,
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    projectId: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-1",
    chatId: "chat-1",
    role: "user",
    content: "Rewrite this",
    isEdited: false,
    editedAt: null,
    feedback: null,
    parentId: null,
    createdAt: CREATED_AT,
    attachments: [],
    ...overrides,
  };
}

function attachment(fileName: string): Attachment {
  return {
    id: `att-${fileName}`,
    messageId: "msg-1",
    fileName,
    fileType: "text/plain",
    fileSize: 10,
    storageKey: `key-${fileName}`,
    createdAt: CREATED_AT,
  };
}

const conversation = [
  message({ id: "m1", role: "user", content: "Rewrite this" }),
  message({ id: "m2", role: "assistant", content: "Here you go", model: "groq-llama3-70b" }),
  message({ id: "m3", role: "system", content: "internal instructions" }),
];

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(new Date("2024-06-01T09:00:00Z"));
});

afterAll(() => {
  jest.useRealTimers();
});

describe("serializeChatMarkdown", () => {
  it("renders a titled document with both speakers", () => {
    const md = serializeChatMarkdown(chat(), conversation);
    expect(md.startsWith("# Launch copy\n")).toBe(true);
    expect(md).toContain("**You:**");
    expect(md).toContain("**ToneCraft:**");
    expect(md).toContain("Here you go");
    expect(md.trimEnd().endsWith("*Generated with ToneCraft*")).toBe(true);
  });

  it("omits system messages", () => {
    expect(serializeChatMarkdown(chat(), conversation)).not.toContain("internal instructions");
  });

  it("includes the tone and platform settings line", () => {
    expect(serializeChatMarkdown(chat(), [])).toContain("**Settings:** professional · linkedin");
  });

  it("omits the settings line when neither is set", () => {
    expect(serializeChatMarkdown(chat({ tone: undefined, platform: null }), [])).not.toContain("**Settings:**");
  });

  it("falls back to a placeholder title", () => {
    expect(serializeChatMarkdown(chat({ title: "" }), [])).toContain("# Untitled chat");
  });

  it("lists attachment file names", () => {
    const md = serializeChatMarkdown(chat(), [message({ attachments: [attachment("a.txt"), attachment("b.pdf")] })]);
    expect(md).toContain("*Attachments: a.txt, b.pdf*");
  });
});

describe("serializeChatTxt", () => {
  it("renders labeled, timestamped plain text", () => {
    const txt = serializeChatTxt(chat(), conversation);
    expect(txt.startsWith("Launch copy\n")).toBe(true);
    expect(txt).toContain("[YOU · May 4, 2024, 10:30 AM]");
    expect(txt).toContain("[TONECRAFT · May 4, 2024, 10:30 AM]");
    expect(txt).toContain("=".repeat(40));
    expect(txt).not.toContain("internal instructions");
  });

  it("falls back to a placeholder title", () => {
    expect(serializeChatTxt(chat({ title: "" }), [])).toContain("Untitled chat");
  });
});

describe("serializeChatHtml", () => {
  it("renders one styled block per non-system message", () => {
    const html = serializeChatHtml(chat(), conversation);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain('<div class="msg user">');
    expect(html).toContain('<div class="msg assistant">');
    expect(html).not.toContain("internal instructions");
  });

  it("escapes HTML in the title and message bodies", () => {
    const html = serializeChatHtml(chat({ title: '<script>alert("x")</script>' }), [
      message({ content: '<img src=x onerror="alert(1)">' }),
    ]);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("converts newlines to line breaks", () => {
    expect(serializeChatHtml(chat(), [message({ content: "one\ntwo" })])).toContain("one<br/>two");
  });
});

describe("serializeChatJson", () => {
  it("emits the chat settings and non-system messages", () => {
    const parsed = JSON.parse(serializeChatJson(chat(), conversation));
    expect(parsed.title).toBe("Launch copy");
    expect(parsed.exportedAt).toBe("2024-06-01T09:00:00.000Z");
    expect(parsed.settings).toEqual({ tone: "professional", platform: "linkedin" });
    expect(parsed.messages).toHaveLength(2);
    expect(parsed.messages[1]).toMatchObject({ role: "assistant", model: "groq-llama3-70b", attachments: [] });
  });

  it("nulls out missing settings and model, and lists attachment names", () => {
    const parsed = JSON.parse(
      serializeChatJson(chat({ tone: undefined, platform: undefined }), [
        message({ attachments: [attachment("a.txt")] }),
      ]),
    );
    expect(parsed.settings).toEqual({ tone: null, platform: null });
    expect(parsed.messages[0].model).toBeNull();
    expect(parsed.messages[0].attachments).toEqual(["a.txt"]);
  });
});

describe("serializeChat", () => {
  it("dispatches on the requested format", () => {
    const c = chat();
    expect(serializeChat("txt", c, conversation)).toBe(serializeChatTxt(c, conversation));
    expect(serializeChat("html", c, conversation)).toBe(serializeChatHtml(c, conversation));
    expect(serializeChat("json", c, conversation)).toBe(serializeChatJson(c, conversation));
    expect(serializeChat("md", c, conversation)).toBe(serializeChatMarkdown(c, conversation));
  });

  it("defaults to markdown for unknown formats", () => {
    const c = chat();
    expect(serializeChat("docx", c, conversation)).toBe(serializeChatMarkdown(c, conversation));
  });

  it("maps every supported format to a MIME type", () => {
    expect(MIME_BY_FORMAT).toEqual({
      md: "text/markdown",
      txt: "text/plain",
      html: "text/html",
      json: "application/json",
    });
  });
});
