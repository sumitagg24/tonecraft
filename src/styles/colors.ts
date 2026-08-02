// ═══════════════════════════════════════════════════════════════════════
// COLOR TOKENS
//
// Single source of truth for every color used in ToneCraft.
//
// Two layers:
//  - `semantic`: resolves to CSS custom properties (`hsl(var(--x))`), so it
//    re-themes automatically when a theme class (.dark, .midnight, …) is
//    applied in globals.css. Use these for any theme-aware surface.
//  - static palettes (`tone`, `platform`, `status`, `brand`): fixed hex values.
//    These are the ONLY place the raw hex values live.
//
// Tailwind theme in `tailwind.config.ts` already maps the semantic vars;
// do NOT redefine hex values inside components — import them here instead.
// ═══════════════════════════════════════════════════════════════════════

export const color = {
  // ─── Brand ────────────────────────────────────────────────────────────
  brand: {
    violet: "#a855f7",
    purple: "#8b5cf6",
    indigo: "#6366f1",
    gradient: "bg-gradient-to-r from-violet-600 to-indigo-600",
    gradientSoft: "bg-gradient-to-br from-violet-500 to-indigo-600",
  },

  // ─── Semantic (theme-aware) ───────────────────────────────────────────
  semantic: {
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    card: "hsl(var(--card))",
    cardForeground: "hsl(var(--card-foreground))",
    popover: "hsl(var(--popover))",
    popoverForeground: "hsl(var(--popover-foreground))",
    primary: "hsl(var(--primary))",
    primaryForeground: "hsl(var(--primary-foreground))",
    secondary: "hsl(var(--secondary))",
    secondaryForeground: "hsl(var(--secondary-foreground))",
    muted: "hsl(var(--muted))",
    mutedForeground: "hsl(var(--muted-foreground))",
    accent: "hsl(var(--accent))",
    accentForeground: "hsl(var(--accent-foreground))",
    destructive: "hsl(var(--destructive))",
    destructiveForeground: "hsl(var(--destructive-foreground))",
    border: "hsl(var(--border))",
    input: "hsl(var(--input))",
    ring: "hsl(var(--ring))",
    sidebar: "hsl(var(--sidebar))",
    sidebarForeground: "hsl(var(--sidebar-foreground))",
  },

  // ─── Tone palette (the 9 writing tones) ───────────────────────────────
  tone: {
    professional: "#3b82f6",
    friendly: "#10b981",
    creative: "#a855f7",
    romantic: "#f43f5e",
    luxury: "#d4a853",
    funny: "#f97316",
    minimal: "#e4e4e7",
    corporate: "#6366f1",
    academic: "#14b8a6",
  },

  // ─── Extended tone aliases (used by tools / suggestions) ──────────────
  toneExtended: {
    genz: "#a855f7",
    casual: "#10b981",
    formal: "#6366f1",
    ceo: "#7c3aed",
    sarcastic: "#f97316",
    polite: "#ec4899",
    dating: "#f43f5e",
    millennial: "#06b6d4",
    luxury: "#d4a853",
  },

  // ─── Platform brand colors ────────────────────────────────────────────
  platform: {
    whatsapp: "#25D366",
    instagram: "#E4405F",
    slack: "#4A154B",
    discord: "#5865F2",
    linkedin: "#0A66C2",
    twitter: "#1DA1F2",
    telegram: "#0088cc",
    email: "#EA4335",
  },

  // ─── Status ───────────────────────────────────────────────────────────
  status: {
    success: "#10b981",
    warning: "#f97316",
    danger: "#ef4444",
    info: "#3b82f6",
  },
} as const;

export type ToneColor = keyof typeof color.tone;
export type PlatformColor = keyof typeof color.platform;
