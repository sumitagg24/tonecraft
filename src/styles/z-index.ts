// ═══════════════════════════════════════════════════════════════════════
// Z-INDEX TOKENS
//
// Semantic stack. Avoid raw `z-[…]` numbers in components; pick a named
// layer so stacking order stays predictable as layers are added.
//
// Current usage (audit): z-10 (18×), z-50 (14×), z-40 (3×), z-[60] (1×),
// z-[9999] (3× — premium cursor / overlays).
// ═══════════════════════════════════════════════════════════════════════

export const zIndex = {
  base: 0,
  content: 1,
  sticky: 10, // sticky headers, mode indicator
  dropdown: 30, // search overlay backdrop
  sidebar: 40, // context menus, in-panel overlays
  overlay: 50, // modals, command palette, action ring
  top: 60, // navbar (fixed)
  cursor: 9999, // premium cursor glow (must stay above everything)
} as const;

export const z = zIndex;
