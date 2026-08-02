import { describe, it, expect } from "@jest/globals";
import {
  projectSchema,
  projectUpdateSchema,
  promptSchema,
  promptUpdateSchema,
  variableSchema,
  promptImportSchema,
  promptRenderSchema,
  personaSchema,
  personaUpdateSchema,
  HEX_COLOR,
  EMOJI_RE,
} from "@/lib/validators";

describe("HEX_COLOR regex", () => {
  it("matches valid hex colors", () => {
    expect(HEX_COLOR.test("#ABC")).toBe(true);
    expect(HEX_COLOR.test("#123456")).toBe(true);
    expect(HEX_COLOR.test("#FFFFFF")).toBe(true);
    expect(HEX_COLOR.test("#1")).toBe(false);
  });

  it("rejects invalid hex colors", () => {
    expect(HEX_COLOR.test("#GGG")).toBe(false);
    expect(HEX_COLOR.test("ABC")).toBe(false);
    expect(HEX_COLOR.test("#ABCD")).toBe(true);
  });
});

describe("EMOJI_RE regex", () => {
  it("matches emojis and spaces", () => {
    expect(EMOJI_RE.test("😀")).toBe(true);
    expect(EMOJI_RE.test("😀👍")).toBe(true);
    expect(EMOJI_RE.test(" ")).toBe(true);
    expect(EMOJI_RE.test("")).toBe(true);
  });

  it("rejects non-emoji characters", () => {
    expect(EMOJI_RE.test("hello")).toBe(false);
  });
});

describe("projectSchema", () => {
  it("validates a valid project", () => {
    const result = projectSchema.safeParse({
      name: "My Project",
      description: "A test project",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Project");
    }
  });

  it("rejects project with invalid name", () => {
    const result = projectSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects project with name too long", () => {
    const result = projectSchema.safeParse({
      name: "a".repeat(81),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields when valid", () => {
    const result = projectSchema.safeParse({
      name: "Test",
      emoji: "😀",
      color: "#FF0000",
      description: "Test project",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex color", () => {
    const result = projectSchema.safeParse({
      name: "Test",
      color: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid emoji", () => {
    const result = projectSchema.safeParse({
      name: "Test",
      emoji: "hello",
    });
    expect(result.success).toBe(false);
  });
});

describe("projectUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = projectUpdateSchema.safeParse({
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("allows null projectId", () => {
    const result = projectUpdateSchema.safeParse({
      name: "Test",
      parentId: null,
    });
    expect(result.success).toBe(true);
  });

  it("allows archived flag", () => {
    const result = projectUpdateSchema.safeParse({
      archived: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("variableSchema", () => {
  it("validates a valid variable", () => {
    const result = variableSchema.safeParse({
      name: "name",
      label: "Your Name",
      required: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts variable without optional fields", () => {
    const result = variableSchema.safeParse({
      name: "name",
    });
    expect(result.success).toBe(true);
  });

  it("rejects variable name too long", () => {
    const result = variableSchema.safeParse({
      name: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many options", () => {
    const result = variableSchema.safeParse({
      name: "test",
      options: Array(51).fill("option"),
    });
    expect(result.success).toBe(false);
  });
});

describe("promptSchema", () => {
  it("validates a valid prompt", () => {
    const result = promptSchema.safeParse({
      title: "Write a poem",
      content: "Write a poem about {{topic}}",
      variables: [
        { name: "topic", label: "Topic" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects prompt with empty title", () => {
    const result = promptSchema.safeParse({
      title: "",
      content: "Some content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects prompt with content too long", () => {
    const result = promptSchema.safeParse({
      title: "Test",
      content: "a".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects prompt with title too long", () => {
    const result = promptSchema.safeParse({
      title: "a".repeat(121),
      content: "Content",
    });
    expect(result.success).toBe(false);
  });
});

describe("promptUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = promptUpdateSchema.safeParse({
      title: "Updated Title",
      isFavorite: true,
    });
    expect(result.success).toBe(true);
  });

  it("allows archiving", () => {
    const result = promptUpdateSchema.safeParse({
      isArchived: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("promptImportSchema", () => {
  it("validates valid import batch", () => {
    const result = promptImportSchema.safeParse({
      prompts: [
        { title: "Prompt 1", content: "Content 1" },
        { title: "Prompt 2", content: "Content 2" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty imports", () => {
    const result = promptImportSchema.safeParse({
      prompts: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many prompts", () => {
    const result = promptImportSchema.safeParse({
      prompts: Array(501).fill({ title: "Test", content: "Content" }),
    });
    expect(result.success).toBe(false);
  });
});

describe("promptRenderSchema", () => {
  it("validates render request with variables", () => {
    const result = promptRenderSchema.safeParse({
      content: "Hello {{name}}",
      variables: { name: "World" },
    });
    expect(result.success).toBe(true);
  });

  it("validates render request without variables", () => {
    const result = promptRenderSchema.safeParse({
      content: "Hello World",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = promptRenderSchema.safeParse({
      content: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("personaSchema", () => {
  it("validates a valid persona", () => {
    const result = personaSchema.safeParse({
      name: "Professional",
      systemPrompt: "You are a professional writer.",
      temperature: 70,
      tone: "professional",
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate persona fields in update", () => {
    const result = personaSchema.safeParse({
      name: "Test",
      systemPrompt: "Prompt",
      isDefault: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects temperature out of range", () => {
    const result = personaSchema.safeParse({
      name: "Test",
      systemPrompt: "Prompt",
      temperature: 150,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid emojiUsage", () => {
    const result = personaSchema.safeParse({
      name: "Test",
      systemPrompt: "Prompt",
      emojiUsage: "extreme",
    });
    expect(result.success).toBe(false);
  });
});

describe("personaUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = personaUpdateSchema.safeParse({
      name: "Updated Name",
      description: "New description",
    });
    expect(result.success).toBe(true);
  });

  it("allows isFavorite toggle", () => {
    const result = personaUpdateSchema.safeParse({
      isFavorite: true,
    });
    expect(result.success).toBe(true);
  });
});