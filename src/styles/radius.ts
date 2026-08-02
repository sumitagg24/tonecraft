// ═══════════════════════════════════════════════════════════════════════
// BORDER RADIUS TOKENS
//
// Values reflect the compiled Tailwind scale (`rounded-*`) which is the
// source of truth for class names. `--radius` is the design base; `sm`/`md`
// are derived from it in tailwind.config.ts. The static values below mirror
// the resulting px so TS can reuse them for computed layout.
//
// Current usage (audit): rounded-xl (84×), rounded-2xl (67×), rounded-lg
// (60×) dominate. Stick to this scale; add a named step rather than an ad-hoc
// `rounded-[…px]` when a new size is needed.
// ═══════════════════════════════════════════════════════════════════════

export const radius = {
  base: "var(--radius)", // 0.75rem design base
  xs: 4, // rounded-sm  (calc(--radius - 4px))
  sm: 6,
  md: 8, // rounded-md  (calc(--radius - 2px))
  lg: 12, // rounded-lg  (var(--radius))
  xl: 16,
  "2xl": 16, // rounded-2xl
  "3xl": 24, // rounded-3xl
  "4xl": 32, // rounded-4xl
  full: 9999,
} as const;

export const rounded = radius;
