import { cn } from "@/lib/utils";

export const recipe = {
  card: {
    base: "rounded-2xl border border-border/50 shadow-card transition-all duration-300",
    glass: "bg-card/60 backdrop-blur-xl",
    solid: "bg-card",
    hover: "hover:border-border/70 hover:shadow-lg hover:-translate-y-0.5",
    glow: "shadow-glow border-primary/20",
    interactive: "cursor-pointer",
  },
  panel: {
    base: "rounded-xl border border-border/40",
    glass: "bg-card/40 backdrop-blur-xl",
    solid: "bg-card",
    elevated: "shadow-premium",
  },
  toolbar: {
    base: "flex items-center gap-1 rounded-xl border border-border/30",
    glass: "bg-card/50 backdrop-blur-xl",
    solid: "bg-muted/50",
    elevated: "shadow-sm",
  },
  message: {
    user: "bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-glow",
    bot: "bg-card border border-border/40 rounded-2xl rounded-bl-sm shadow-card hover:border-white/10",
    streaming: "bg-card/80 border border-border/30 rounded-2xl rounded-bl-sm",
    editing: "bg-muted/30 border border-border/40 rounded-2xl",
  },
  badge: {
    base: "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium",
    tone: "border",
    glass: "bg-white/5 border border-white/10 backdrop-blur-sm",
    dot: "w-1.5 h-1.5 rounded-full",
  },
  input: {
    base: "w-full bg-transparent border border-border/40 rounded-xl px-4 py-3 text-sm transition-all duration-200 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30",
    ghost: "bg-muted/20 border-border/40",
    glass: "bg-white/5 border-white/10 backdrop-blur-sm",
  },
  button: {
    base: "inline-flex items-center justify-center gap-2 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-muted hover:text-accent-foreground",
    glass: "bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 text-white shadow-dock",
    gradient: "bg-brand text-brand-foreground hover:bg-brand/90 shadow-[0_8px_24px_-8px_hsl(var(--brand)/0.5)]",
  },
  sidebar: {
    item: "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
    active: "bg-muted/50 border border-border/40 shadow-sm",
    inactive: "hover:bg-muted/30 border border-transparent",
  },
  divider: "w-px h-5 bg-border/40 mx-1",
  section: "p-2 border-b border-border/40",
} as const;

export type RecipeVariant<T extends keyof typeof recipe> = keyof (typeof recipe)[T];

export function cardRecipe(classNames?: string) {
  return cn(recipe.card.base, recipe.card.glass, classNames);
}

export function glassCard(classNames?: string) {
  return cn(recipe.card.base, recipe.card.glass, recipe.card.hover, classNames);
}

export function interactiveCard(classNames?: string) {
  return cn(recipe.card.base, recipe.card.glass, recipe.card.hover, recipe.card.interactive, classNames);
}

export function panelRecipe(classNames?: string) {
  return cn(recipe.panel.base, recipe.panel.glass, classNames);
}

export function toolbarRecipe(classNames?: string) {
  return cn(recipe.toolbar.base, recipe.toolbar.glass, classNames);
}

export function sidebarItemRecipe(active: boolean, classNames?: string) {
  return cn(recipe.sidebar.item, active ? recipe.sidebar.active : recipe.sidebar.inactive, classNames);
}
