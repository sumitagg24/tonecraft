import { describe, it, expect } from "@jest/globals";
import {
  sniffMimeType,
  validateFile,
  DEFAULT_ALLOWED_EXTENSIONS,
  KNOWLEDGE_ALLOWED_EXTENSIONS,
} from "@/lib/file-validation";

const bytes = (...b: number[]) => new Uint8Array(b);
const text = (s: string) => new Uint8Array(Buffer.from(s, "utf8"));

const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01);
const GIF = bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
const WEBP = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50);
const WAV = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45);
const PDF = bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31);
const MP3_ID3 = bytes(0x49, 0x44, 0x33, 0x04, 0x00);
const MP3_FRAME = bytes(0xff, 0xfb, 0x90, 0x00);
const BINARY_JUNK = bytes(0x00, 0x01, 0x02, 0x03);

describe("sniffMimeType", () => {
  it("recognizes known binary magic numbers", () => {
    expect(sniffMimeType(JPEG)).toBe("image/jpeg");
    expect(sniffMimeType(PNG)).toBe("image/png");
    expect(sniffMimeType(GIF)).toBe("image/gif");
    expect(sniffMimeType(WEBP)).toBe("image/webp");
    expect(sniffMimeType(PDF)).toBe("application/pdf");
    expect(sniffMimeType(MP3_ID3)).toBe("audio/mpeg");
    expect(sniffMimeType(MP3_FRAME)).toBe("audio/mpeg");
    expect(sniffMimeType(WAV)).toBe("audio/wav");
  });

  it("treats printable content as text", () => {
    expect(sniffMimeType(text("hello, world\n"))).toBe("text/plain");
    expect(sniffMimeType(text("{\"a\": 1}"))).toBe("text/plain");
    expect(sniffMimeType(new Uint8Array(0))).toBe("text/plain");
  });

  it("falls back to octet-stream for unrecognized binary content", () => {
    expect(sniffMimeType(BINARY_JUNK)).toBe("application/octet-stream");
  });

  it("rejects mostly-unprintable content as binary", () => {
    const mostlyControl = new Uint8Array(100).fill(0x01);
    expect(sniffMimeType(mostlyControl)).toBe("application/octet-stream");
  });
});

describe("validateFile — extension allowlist", () => {
  it("rejects files without an extension", () => {
    expect(validateFile("noext", "text/plain", text("hi"))).toEqual({
      ok: false,
      reason: "File extension not allowed",
    });
  });

  it("rejects extensions outside the allowlist", () => {
    expect(validateFile("app.exe", "application/pdf", PDF).ok).toBe(false);
    expect(validateFile("notes.md", "text/markdown", text("# hi")).ok).toBe(false);
  });

  it("uses the narrower knowledge allowlist when provided", () => {
    expect(validateFile("notes.md", "text/markdown", text("# hi"), KNOWLEDGE_ALLOWED_EXTENSIONS).ok).toBe(true);
    expect(validateFile("song.mp3", "audio/mpeg", MP3_ID3, KNOWLEDGE_ALLOWED_EXTENSIONS)).toEqual({
      ok: false,
      reason: "File extension not allowed",
    });
    expect(DEFAULT_ALLOWED_EXTENSIONS.has("mp3")).toBe(true);
  });

  it("matches extensions case-insensitively", () => {
    expect(validateFile("PHOTO.PNG", "image/png", PNG)).toEqual({ ok: true, mime: "image/png" });
  });

  it("rejects empty files", () => {
    expect(validateFile("empty.txt", "text/plain", new Uint8Array(0))).toEqual({
      ok: false,
      reason: "File is empty",
    });
  });
});

describe("validateFile — content sniffing", () => {
  it("accepts binary types whose magic bytes match the declared MIME", () => {
    expect(validateFile("a.jpg", "image/jpeg", JPEG)).toEqual({ ok: true, mime: "image/jpeg" });
    expect(validateFile("a.pdf", "application/pdf", PDF)).toEqual({ ok: true, mime: "application/pdf" });
    expect(validateFile("a.wav", "audio/wav", WAV)).toEqual({ ok: true, mime: "audio/wav" });
  });

  it("normalizes common MIME aliases", () => {
    expect(validateFile("a.jpg", "image/jpg", JPEG)).toEqual({ ok: true, mime: "image/jpeg" });
    expect(validateFile("a.mp3", "audio/mp3", MP3_ID3)).toEqual({ ok: true, mime: "audio/mpeg" });
    expect(validateFile("a.js", "application/x-javascript", text("const a = 1;")).ok).toBe(true);
  });

  it("rejects a binary file whose content is a different subtype", () => {
    expect(validateFile("fake.png", "image/png", JPEG)).toEqual({
      ok: false,
      reason: "File content does not match its declared type",
    });
  });

  it("rejects a binary file whose content is another family", () => {
    expect(validateFile("fake.png", "image/png", text("not an image at all"))).toEqual({
      ok: false,
      reason: "File content does not match its declared type",
    });
  });

  it("accepts text declarations with printable content", () => {
    expect(validateFile("a.txt", "text/plain", text("plain content"))).toEqual({ ok: true, mime: "text/plain" });
    expect(validateFile("a.json", "application/json", text("{}"))).toEqual({ ok: true, mime: "text/plain" });
    expect(validateFile("a.html", "text/html", text("<p>hi</p>"))).toEqual({ ok: true, mime: "text/plain" });
  });

  it("rejects binary content masquerading as text", () => {
    expect(validateFile("a.txt", "text/plain", BINARY_JUNK)).toEqual({
      ok: false,
      reason: "File content is not a supported type",
    });
  });

  it("allows a text declaration whose content sniffs as a supported binary type", () => {
    expect(validateFile("a.txt", "text/plain", PDF)).toEqual({ ok: true, mime: "application/pdf" });
  });

  it("validates purely by sniff when the declared MIME is unknown", () => {
    expect(validateFile("a.png", "", PNG)).toEqual({ ok: true, mime: "image/png" });
    expect(validateFile("a.png", "application/octet-stream", PNG)).toEqual({ ok: true, mime: "image/png" });
    expect(validateFile("a.txt", "", BINARY_JUNK)).toEqual({
      ok: false,
      reason: "File content is not a supported type",
    });
  });

  it("rejects declared MIME families that are not supported at all", () => {
    expect(validateFile("a.txt", "application/zip", text("hello"))).toEqual({
      ok: false,
      reason: "File type not allowed",
    });
  });
});
