// ═══════════════════════════════════════════════════════════════════════
// ELEVATION / SHADOW TOKENS
//
// Single source of truth for shadows. Values mirror the Tailwind `boxShadow`
// theme (`shadow-card`, `shadow-glow`, `shadow-premium`, …) plus a small
// generic elevation ramp.
//
// Current usage (audit): shadow-glow (25×), shadow-sm (17×), shadow-card
// (14×), shadow-lg (9×), shadow-premium (7×). When a new surface needs
// elevation, prefer an existing named token over an ad-hoc `shadow-[…]`.
// ═══════════════════════════════════════════════════════════════════════

export const elevation = {
  flat: "none",

  // Generic ramp
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",

  // Branded surfaces
  card: "0 0 0 1px hsl(0 0% 100% / 0.03), 0 4px 8px hsl(0 0% 0% / 0.25), 0 12px 24px hsl(0 0% 0% / 0.15)",
  premium: "0 0 0 1px hsl(0 0% 100% / 0.05), 0 2px 4px hsl(0 0% 0% / 0.3), 0 8px 16px hsl(0 0% 0% / 0.2)",
  glass: "0 8px 32px rgba(0, 0, 0, 0.12)",
  dock: "0 4px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
  innerGlow: "inset 0 1px 0 0 hsl(0 0% 100% / 0.05)",

  // Primary-keyed glow
  glow: "0 0 20px -4px hsl(var(--primary) / 0.15)",
  glowLg: "0 0 40px -8px hsl(var(--primary) / 0.2)",

  // Modal ramp
  overlay: "0 8px 32px rgba(0, 0, 0, 0.12)",
  modal: "0 16px 48px rgba(0, 0, 0, 0.2)",
} as const;

export const shadow = elevation;
