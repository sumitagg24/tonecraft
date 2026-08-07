/**
 * White-label branding helpers (Phase 13).
 *
 * An Organization's `branding` JSON drives the app's look for that org:
 * custom logo, primary/accent colors, and a custom domain (documented in the
 * admin UI — the custom domain itself is wired at the hosting layer).
 *
 * `applyBrandingCssVars` translates the branding config into CSS custom
 * properties that override the theme tokens from `src/styles/colors.ts` /
 * `globals.css` (e.g. `--primary`, `--ring`). It is safe to call in a
 * client component (returns a cleanup function) and is a no-op when no
 * branding is configured.
 */

export interface OrgBranding {
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  customDomain?: string | null;
  supportEmail?: string | null;
}

export const DEFAULT_BRANDING: OrgBranding = {
  logoUrl: null,
  primaryColor: null,
  accentColor: null,
  customDomain: null,
  supportEmail: null,
};

/** Parse an org `branding` JSON blob defensively (it may be `{}`, null, or malformed). */
export function parseBranding(raw: unknown): OrgBranding {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_BRANDING };
  const b = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    logoUrl: str(b.logoUrl),
    primaryColor: str(b.primaryColor),
    accentColor: str(b.accentColor),
    customDomain: str(b.customDomain),
    supportEmail: str(b.supportEmail),
  };
}

/** Validate a hex color like `#6366F1`. Returns the normalized value or null. */
export function normalizeHexColor(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = value.trim().match(/^#([0-9A-Fa-f]{6})$/);
  return m ? `#${m[1].toUpperCase()}` : null;
}

/** Hex (#RRGGBB) → `hsl(H S% L%)` triple usable inside `hsl(var(--x))` chains. */
function hexToHslTriple(hex: string): string {
  const m = hex.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
  if (!m) return "";
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Produce CSS custom property overrides for an org's branding.
 *
 * The theme tokens use the `hsl(<triple>)` format (see globals.css), so we
 * convert hex colors into the triple form and set `--primary`, `--ring`, and
 * `--brand-accent`. Logo + domain are not CSS — they are consumed by
 * components via `useOrganizationBranding`.
 */
export function brandingCssVars(branding: OrgBranding): Record<string, string> {
  const vars: Record<string, string> = {};
  const primary = normalizeHexColor(branding.primaryColor);
  const accent = normalizeHexColor(branding.accentColor);
  if (primary) {
    const triple = hexToHslTriple(primary);
    if (triple) {
      vars["--primary"] = triple;
      vars["--ring"] = triple;
    }
  }
  if (accent) {
    const triple = hexToHslTriple(accent);
    if (triple) vars["--brand-accent"] = triple;
  }
  return vars;
}

/**
 * Apply branding CSS vars to `document.documentElement`. Returns a cleanup
 * function that removes exactly the vars that were set. No-op in SSR/test.
 */
export function applyBrandingCssVars(branding: OrgBranding | null | undefined): () => void {
  if (typeof document === "undefined") return () => {};
  const vars = brandingCssVars(branding ?? {});
  const keys = Object.keys(vars);
  if (keys.length === 0) return () => {};
  const root = document.documentElement;
  const prev = new Map<string, string>();
  for (const key of keys) {
    prev.set(key, root.style.getPropertyValue(key));
    root.style.setProperty(key, vars[key]);
  }
  return () => {
    for (const key of keys) {
      const old = prev.get(key);
      if (old) root.style.setProperty(key, old);
      else root.style.removeProperty(key);
    }
  };
}
