// ═══════════════════════════════════════════════════════════════════════
// SPACING TOKENS
//
// Mirrors the Tailwind default spacing scale (0.25rem base) so `gap-4`,
// `p-3`, `mt-8` etc. in JSX match the numeric constants here.
//
// Values are in px. Use these for anything that must be computed in JS
// (layout widths, offsets, motion deltas). For class names, keep using the
// matching Tailwind utility — do NOT hand-write `p-[17px]` style values;
// if a size is missing from the scale, extend the scale first.
// ═══════════════════════════════════════════════════════════════════════

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  18: 72,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
} as const;

export const space = spacing;
