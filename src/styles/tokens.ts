export const tokens = {
  spacing: {
    xs: 2, sm: 4, md: 8, lg: 12, xl: 16, "2xl": 20, "3xl": 24, "4xl": 32, "5xl": 40, "6xl": 48, "7xl": 64, "8xl": 80, "9xl": 96,
  },
  radius: {
    sm: 6, md: 8, lg: 12, xl: 16, "2xl": 20, "3xl": 24, "4xl": 32, full: 9999,
  },
  shadow: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    glass: "0 8px 32px rgba(0, 0, 0, 0.12)",
    glow: "0 0 20px -4px hsl(var(--primary) / 0.15)",
    "glow-lg": "0 0 40px -8px hsl(var(--primary) / 0.2)",
    premium: "0 0 0 1px hsl(0 0% 100% / 0.05), 0 2px 4px hsl(0 0% 0% / 0.3), 0 8px 16px hsl(0 0% 0% / 0.2)",
  },
  animation: {
    fast: "150ms",
    normal: "250ms",
    slow: "400ms",
    page: "500ms",
  },
  blur: {
    sm: 4, md: 8, lg: 12, xl: 20, "2xl": 24, "3xl": 32,
  },
  elevation: {
    flat: "0",
    raised: "0 4px 12px rgba(0,0,0,0.08)",
    overlay: "0 8px 32px rgba(0,0,0,0.12)",
    modal: "0 16px 48px rgba(0,0,0,0.2)",
  },
  font: {
    sans: "var(--font-sans)",
    mono: "var(--font-mono)",
    size: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
    },
    weight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    leading: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },
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
  { id: "midnight", label: "Midnight", icon: "MoonStar" },
  { id: "aurora", label: "Aurora", icon: "Sparkles" },
  { id: "glass", label: "Glass", icon: "Droplets" },
  { id: "oled", label: "OLED", icon: "Circle" },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
