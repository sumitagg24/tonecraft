// ═══════════════════════════════════════════════════════════════════════
// TYPOGRAPHY TOKENS
//
// Font sizes MUST match tailwind.config.ts `fontSize` (the compiled source
// of truth for CSS). Keep both in sync when the scale changes.
//
// Line heights are unitless ratios (matching Tailwind's [size, { lineHeight }]
// tuples). The `micro` scale captures the 9–11px sizes used across the
// workspace; Phase 7 should migrate these toward ≥12px for legibility.
// ═══════════════════════════════════════════════════════════════════════

export const fontFamily = {
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
} as const;

export const fontSize = {
  micro: "0.625rem", // 10px — deprecated; migrate to sm
  tiny: "0.6875rem", // 11px — deprecated; migrate to sm
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem", // 36px
  "5xl": "3rem", // 48px
  "6xl": "3.75rem", // 60px
  "7xl": "4.5rem", // 72px
  "8xl": "6rem", // 96px
  "9xl": "8rem", // 128px
} as const;

export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.4,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const typography = {
  family: fontFamily,
  size: fontSize,
  leading: lineHeight,
  weight: fontWeight,
} as const;
