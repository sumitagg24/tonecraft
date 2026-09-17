/**
 * Extension storage + adapter-registry tests (DOM-free).
 * Covers URL normalization, adapter host matching order, and tone defaults.
 */
import { normalizeBaseUrl, getPrefs } from "../src/shared/storage";
import { adapterForHost } from "../src/content/adapters/index";

describe("normalizeBaseUrl", () => {
  test("strips trailing slashes, keeps origin + path", () => {
    expect(normalizeBaseUrl("https://www.tonecraft.site///")).toBe("https://www.tonecraft.site");
    expect(normalizeBaseUrl("http://localhost:3000/")).toBe("http://localhost:3000");
  });

  test("rejects non-http schemes and garbage to the production default", () => {
    expect(normalizeBaseUrl("javascript:alert(1)")).toBe("https://www.tonecraft.site");
    expect(normalizeBaseUrl("not a url")).toBe("https://www.tonecraft.site");
    expect(normalizeBaseUrl("")).toBe("https://www.tonecraft.site");
    expect(normalizeBaseUrl("ftp://files.example.com")).toBe("https://www.tonecraft.site");
  });
});

describe("getPrefs defaults without browser APIs", () => {
  test("returns safe defaults in Node (no chrome global)", async () => {
    const prefs = await getPrefs();
    expect(prefs.baseUrl).toBe("https://www.tonecraft.site");
    expect(prefs.floatingButton).toBe(true);
    expect(prefs.contextMenu).toBe(true);
    expect(prefs.onboardingDone).toBe(false);
  });
});

describe("adapterForHost", () => {
  test("routes known sites to dedicated adapters", () => {
    expect(adapterForHost("mail.google.com").id).toBe("gmail");
    expect(adapterForHost("www.linkedin.com").id).toBe("linkedin");
    expect(adapterForHost("app.slack.com").id).toBe("slack");
    expect(adapterForHost("discord.com").id).toBe("discord");
    expect(adapterForHost("x.com").id).toBe("x");
    expect(adapterForHost("twitter.com").id).toBe("x");
    expect(adapterForHost("www.notion.so").id).toBe("notion");
    expect(adapterForHost("github.com").id).toBe("github");
    expect(adapterForHost("www.reddit.com").id).toBe("reddit");
    expect(adapterForHost("outlook.live.com").id).toBe("outlook");
    expect(adapterForHost("teams.microsoft.com").id).toBe("teams");
    expect(adapterForHost("www.facebook.com").id).toBe("facebook");
    expect(adapterForHost("www.instagram.com").id).toBe("facebook");
  });

  test("unknown hosts fall back to generic", () => {
    expect(adapterForHost("example.com").id).toBe("generic");
    expect(adapterForHost("").id).toBe("generic");
  });

  test("lookalike domains do NOT match site adapters", () => {
    expect(adapterForHost("evilgmail.com").id).toBe("generic");
    expect(adapterForHost("mail.google.com.evil.com").id).toBe("generic");
    expect(adapterForHost("notion.so.evil.com").id).toBe("generic");
  });

  test("every adapter has selectors and a doc note", () => {
    for (const host of ["mail.google.com", "www.linkedin.com", "example.com"]) {
      const adapter = adapterForHost(host);
      expect(adapter.editorSelectors.length).toBeGreaterThan(0);
      expect(adapter.note.length).toBeGreaterThan(10);
    }
  });
});
