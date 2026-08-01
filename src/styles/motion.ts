import type { Transition, Variants } from "framer-motion";

// ─── Duration ──────────────────────────────────────────────────────────
export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.35,
  slow: 0.5,
  verySlow: 0.7,
} as const;

// ─── Easing ────────────────────────────────────────────────────────────
export const ease = {
  default: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  in: [0.4, 0, 1, 1] as [number, number, number, number],
  out: [0, 0, 0.2, 1] as [number, number, number, number],
  inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  emphasized: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  emphasizedDecel: [0.05, 0.7, 0.1, 1] as [number, number, number, number],
  emphasizedAccel: [0.3, 0, 0.8, 0.15] as [number, number, number, number],
  spring: "spring" as const,
  linear: "linear" as const,
  backOut: "backOut" as const,
} as const;

// ─── Spring Presets ────────────────────────────────────────────────────
export const spring: Record<string, Transition> = {
  snappy: { type: "spring", stiffness: 300, damping: 25 },
  gentle: { type: "spring", stiffness: 200, damping: 20 },
  soft: { type: "spring", stiffness: 150, damping: 18 },
  heavy: { type: "spring", stiffness: 400, damping: 30 },
  elastic: { type: "spring", stiffness: 260, damping: 20 },
};

// ─── Hover / Tap ───────────────────────────────────────────────────────
export const hover: Record<string, Transition> = {
  button: { duration: duration.fast, ease: ease.default },
  card: { duration: duration.fast, ease: ease.default },
  icon: { duration: duration.instant, ease: ease.default },
  sidebarItem: { duration: duration.instant, ease: ease.default },
  toolCard: { duration: duration.fast, ease: ease.default },
};

export const tap: Record<string, Transition> = {
  button: { duration: duration.instant, ease: ease.default },
  subtle: { duration: duration.instant, ease: ease.default },
};

export const hoverScale = {
  button: { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, transition: hover.button },
  card: { whileHover: { scale: 1.01 }, transition: hover.card },
  icon: { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, transition: hover.icon },
  sidebarItem: { whileHover: { scale: 1.01 }, transition: hover.sidebarItem },
  subtle: { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, transition: hover.button },
};

export const hoverLift = {
  card: { whileHover: { y: -4 }, transition: hover.card },
  pricing: { whileHover: { y: -6 }, transition: hover.card },
};

// ─── Base Variants ─────────────────────────────────────────────────────
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
};

export const slideDown: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export const slideRight: Variants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
};

export const slideLeft: Variants = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
};

export const blurIn: Variants = {
  initial: { opacity: 0, filter: "blur(8px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(8px)" },
};

export const expandCollapse: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
};

// ─── Composite Transitions ─────────────────────────────────────────────
export const pageTransition: { enter: Transition; exit: Transition } = {
  enter: { duration: duration.slow, ease: ease.emphasizedDecel },
  exit: { duration: duration.normal, ease: ease.emphasizedAccel },
};

export const sidebarTransition: Transition = {
  duration: duration.normal,
  ease: ease.default,
};

export const modalTransition: Transition = {
  type: "spring", stiffness: 300, damping: 25,
};

export const cardTransition: Transition = {
  duration: duration.normal, ease: ease.emphasized,
};

export const comboboxTransition: Transition = {
  type: "spring", damping: 25, stiffness: 300,
};

// ─── Loading Presets ───────────────────────────────────────────────────
export const loading = {
  spin: { animate: { rotate: 360 }, transition: { duration: 1, repeat: Infinity, ease: "linear" } as Transition },
  pulse: { animate: { opacity: [0.3, 1, 0.3] }, transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } as Transition },
  shimmer: { animate: { x: ["-100%", "100%"] }, transition: { duration: 1.5, repeat: Infinity, ease: "linear" } as Transition },
  typing: { animate: { y: [0, -4, 0], opacity: [0.4, 1, 0.4] }, transition: { duration: 0.8, repeat: Infinity } as Transition },
  glow: { animate: { scale: [1, 1.05, 1] }, transition: { duration: 2, repeat: Infinity } as Transition },
  breathe: { animate: { scale: [1, 1.03, 1], opacity: [0.7, 1, 0.7] }, transition: { duration: 3, repeat: Infinity } as Transition },
  marquee: { animate: { x: ["0%", "-50%"] }, transition: { duration: 30, repeat: Infinity, ease: "linear" } as Transition },
};

// ─── Chat Message Variants ────────────────────────────────────────────
export const messageVariants: { incoming: Variants; outgoing: Variants } = {
  incoming: { initial: { opacity: 0, y: 16, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 } },
  outgoing: { initial: { opacity: 0, x: 12 }, animate: { opacity: 1, x: 0 } },
};

export const avatar: Transition = { ...spring.elastic, delay: 0.05 };

export const sidebar = {
  content: {
    expand: { height: "auto", opacity: 1 } as const,
    collapse: { height: 0, opacity: 0 } as const,
    transition: { duration: duration.fast, ease: ease.default } as Transition,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// WORD / TEXT ANIMATION
// ═══════════════════════════════════════════════════════════════════════

export const wordReveal: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: ease.emphasizedDecel,
      delay: i * 0.04,
    },
  }),
};

export const letterReveal: Variants = {
  hidden: { opacity: 0, y: 20, rotateX: -90 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.4,
      ease: ease.out,
      delay: i * 0.02,
    },
  }),
};

export const charReveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: ease.out,
      delay: i * 0.015,
    },
  }),
};

// ═══════════════════════════════════════════════════════════════════════
// SECTION TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════

export const sectionReveal: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const sectionItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: ease.emphasizedDecel },
  },
};

export const sectionChip: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: ease.out },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// PREMIUM HOVER / CARD VARIANTS
// ═══════════════════════════════════════════════════════════════════════

export const card3D = {
  rest: { scale: 1, y: 0, boxShadow: "0 2px 8px hsl(0 0% 0% / 0.06)" },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 12px 40px -8px hsl(0 0% 0% / 0.12)",
    transition: { duration: 0.3, ease: ease.default },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// SEMANTIC MOTION PRESETS
// ═══════════════════════════════════════════════════════════════════════

export const MotionPresets = {
  CardEntrance: fadeInUp,
  SidebarReveal: slideRight,
  PromptAppear: { ...fadeInUp, initial: { opacity: 0, y: 24 } } as Variants,
  MessageAppear: messageVariants.incoming,
  FloatingPanel: fadeInScale,
  GlassCard: fadeInUp,
  HeroReveal: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } } as Variants,
  Notification: slideDown,
  ChipAppear: scaleIn,
  ModalOpen: fadeInScale,
  DrawerOpen: slideRight,
  ToolbarAppear: { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 } } as Variants,
  QuickAction: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } } as Variants,
  WordReveal: wordReveal,
  SectionEntrance: sectionReveal,
  SectionItem: sectionItem,
  SectionChip: sectionChip,
  TiltCard: card3D,
};

export const MotionStagger = {
  Fast: {
    container: { animate: { transition: { staggerChildren: 0.03 } } } as Variants,
    children: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } } as Variants,
  },
  Normal: {
    container: { animate: { transition: { staggerChildren: 0.05 } } } as Variants,
    children: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } } as Variants,
  },
  Slow: {
    container: { animate: { transition: { staggerChildren: 0.08 } } } as Variants,
    children: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } as Variants,
  },
  Grid: {
    container: { animate: { transition: { staggerChildren: 0.04 } } } as Variants,
    children: { initial: { opacity: 0, y: 20, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 } } as Variants,
  },
  Sidebar: {
    container: { animate: { transition: { staggerChildren: 0.03 } } } as Variants,
    children: { initial: { opacity: 0, x: -12 }, animate: { opacity: 1, x: 0 } } as Variants,
  },
  Messages: {
    container: { animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } } as Variants,
    children: { initial: { opacity: 0, y: 16, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 } } as Variants,
  },
  Templates: {
    container: { animate: { transition: { staggerChildren: 0.04 } } } as Variants,
    children: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } } as Variants,
  },
  Cards: {
    container: { animate: { transition: { staggerChildren: 0.05 } } } as Variants,
    children: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } as Variants,
  },
};

// ─── AI-Specific Motion ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ai: Record<string, { initial?: any; animate: any; transition: Transition }> = {
  thinking: {
    animate: { scale: [1, 1.02, 1], opacity: [0.6, 1, 0.6] },
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
  streaming: {
    animate: { opacity: [0.3, 1, 0.3] },
    transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
  },
  typing: loading.typing,
  reasoning: {
    animate: { rotate: 360 },
    transition: { duration: 2, repeat: Infinity, ease: "linear" },
  },
  responseFinished: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: spring.snappy,
  },
  toolActivated: {
    initial: { scale: 0, rotate: -90 },
    animate: { scale: 1, rotate: 0 },
    transition: spring.elastic,
  },
  workflowProgress: {
    animate: { width: ["0%", "100%"] },
    transition: { duration: 3, ease: "easeInOut" },
  },
  suggestionChip: {
    initial: { opacity: 0, y: 10, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: spring.gentle,
  },
  providerSwitch: {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: duration.fast },
  },
  contextUpdate: {
    animate: { backgroundColor: ["hsl(var(--primary) / 0)", "hsl(var(--primary) / 0.1)", "hsl(var(--primary) / 0)"] },
    transition: { duration: 0.6 },
  },
};
