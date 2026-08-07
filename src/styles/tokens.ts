// ═══════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — AGGREGATOR
//
// Import tokens from their dedicated modules:
//   colors.ts     → color
//   spacing.ts    → spacing / space
//   typography.ts → typography / fontSize / fontFamily / fontWeight
//   radius.ts     → radius / rounded
//   elevation.ts  → elevation / shadow
//   z-index.ts    → zIndex / z
//   motion.ts     → duration / ease / spring / variants (see Motion-System.md)
//
// This file re-exports them all for one-import convenience:
//   import { color, spacing, radius, elevation, zIndex } from "@/styles/tokens";
//
// `tokens` below is the legacy aggregated object. New code should use the
// individual modules; this object is retained for backward compatibility.
// ═══════════════════════════════════════════════════════════════════════

export * from "./colors";
export * from "./spacing";
export * from "./typography";
export * from "./radius";
export * from "./elevation";
export * from "./z-index";
export * from "./motion";

import { color } from "./colors";
import { spacing } from "./spacing";
import { typography } from "./typography";
import { radius } from "./radius";
import { elevation } from "./elevation";
import { zIndex } from "./z-index";

export const tokens = {
  color,
  spacing: {
    xs: spacing[0.5],
    sm: spacing[1],
    md: spacing[2],
    lg: spacing[3],
    xl: spacing[4],
    "2xl": spacing[5],
    "3xl": spacing[6],
    "4xl": spacing[8],
    "5xl": spacing[10],
    "6xl": spacing[12],
    "7xl": spacing[16],
    "8xl": spacing[20],
    "9xl": spacing[24],
  },
  radius: {
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
    xl: radius.xl,
    "2xl": radius["2xl"],
    "3xl": radius["3xl"],
    "4xl": radius["4xl"],
    full: radius.full,
  },
  shadow: {
    sm: elevation.sm,
    md: elevation.md,
    lg: elevation.lg,
    xl: elevation.xl,
    glass: elevation.glass,
    glow: elevation.glow,
    "glow-lg": elevation.glowLg,
    premium: elevation.premium,
  },
  animation: {
    fast: "150ms",
    normal: "250ms",
    slow: "400ms",
    page: "500ms",
  },
  blur: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
  },
  elevation: {
    flat: elevation.flat,
    raised: elevation.md,
    overlay: elevation.overlay,
    modal: elevation.modal,
  },
  font: {
    sans: typography.family.sans,
    mono: typography.family.mono,
    size: typography.size,
    weight: typography.weight,
    leading: typography.leading,
  },
  zIndex,
  sidebar: {
    width: 280,
    collapsedWidth: 56,
  },
  topnav: {
    height: 56,
  },
} as const;

export const themes = [
  { id: "light", label: "Light", icon: "Sun" },
  { id: "dark", label: "Dark", icon: "Moon" },
  { id: "midnight", label: "Midnight", icon: "Moon" },
  { id: "aurora", label: "Aurora", icon: "Wand2" },
  { id: "glass", label: "Glass", icon: "Droplets" },
  { id: "oled", label: "OLED", icon: "Circle" },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
