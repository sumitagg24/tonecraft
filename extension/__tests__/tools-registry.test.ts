/**
 * Extension tool-registry parity tests.
 *
 * Guards against drift: every backend toolId referenced by the extension must
 * exist in the website's REAL ToolDefinitions, and every assist action must
 * exist in the /api/ai/assist contract. If the site renames a tool, this
 * test fails before users get a broken button.
 */
import { tools as siteTools } from "@/components/tools/ToolDefinitions";
import { EXTENSION_TOOLS, EXTENSION_TONES, CONTEXT_MENU_TOOLS, TOOL_BY_ID } from "../src/shared/constants";

const ASSIST_ACTIONS = new Set([
  "rewrite",
  "summarize",
  "expand",
  "grammar",
  "tone",
  "continue",
  "plan",
  "research",
  "meeting_notes",
]);

describe("extension tool registry parity", () => {
  const siteIds = new Set(siteTools.map((t) => t.id));

  test("registry ids are unique and non-empty", () => {
    const ids = EXTENSION_TOOLS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of EXTENSION_TOOLS) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
    }
  });

  test("every tools-backend toolId exists on the website", () => {
    for (const tool of EXTENSION_TOOLS) {
      if (tool.backend.kind === "tools") {
        expect(siteIds.has(tool.backend.toolId ?? "")).toBe(true);
      }
    }
  });

  test("every assist action exists in the assist contract", () => {
    for (const tool of EXTENSION_TOOLS) {
      if (tool.backend.kind === "assist") {
        expect(ASSIST_ACTIONS.has(tool.backend.assistAction ?? "")).toBe(true);
      }
    }
  });

  test("every tone maps to a real site toolId", () => {
    for (const tone of EXTENSION_TONES) {
      expect(siteIds.has(tone.toolId)).toBe(true);
    }
  });

  test("context menu ids all exist and support selection", () => {
    for (const id of CONTEXT_MENU_TOOLS) {
      expect(TOOL_BY_ID[id]).toBeDefined();
      expect(TOOL_BY_ID[id].supportsSelection).toBe(true);
    }
  });

  test("compose templates target empty editors", () => {
    const composers = EXTENSION_TOOLS.filter((t) => t.supportsEmptyEditor && !t.supportsSelection);
    expect(composers.length).toBeGreaterThanOrEqual(3);
  });
});
