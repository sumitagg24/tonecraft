import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        surface: {
          DEFAULT: "hsl(240 10% 6%)",
          elevated: "hsl(240 10% 8%)",
          overlay: "hsl(240 10% 5%)",
        },
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
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "SF Pro Display",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        display: [
          "var(--font-sans)",
          "SF Pro Display",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        // micro-scale tokens (Phase 8.16): replace arbitrary text-[9/10/11px]
        nano: ["0.5625rem", { lineHeight: "1.4" }], // 9px — decorative metadata only
        micro: ["0.625rem", { lineHeight: "1.4" }], // 10px
        tiny: ["0.6875rem", { lineHeight: "1.45" }], // 11px
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.875rem", { lineHeight: "1.5" }],
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.125rem", { lineHeight: "1.6" }],
        xl: ["1.25rem", { lineHeight: "1.5" }],
        "2xl": ["1.5rem", { lineHeight: "1.4" }],
        "3xl": ["1.875rem", { lineHeight: "1.3" }],
        "4xl": ["2.25rem", { lineHeight: "1.2" }],
        "5xl": ["3rem", { lineHeight: "1.1" }],
        "6xl": ["3.75rem", { lineHeight: "1.05" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "0.95" }],
        "9xl": ["8rem", { lineHeight: "0.9" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
        "34": "8.5rem",
        "38": "9.5rem",
        "42": "10.5rem",
        "50": "12.5rem",
        "58": "14.5rem",
        "62": "15.5rem",
        "70": "17.5rem",
        "86": "21.5rem",
        "98": "24.5rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "premium": "0 0 0 1px hsl(0 0% 100% / 0.05), 0 2px 4px hsl(0 0% 0% / 0.3), 0 8px 16px hsl(0 0% 0% / 0.2)",
        "card": "0 0 0 1px hsl(0 0% 100% / 0.03), 0 4px 8px hsl(0 0% 0% / 0.25), 0 12px 24px hsl(0 0% 0% / 0.15)",
        "glow": "0 0 20px -4px hsl(var(--primary) / 0.15)",
        "glow-lg": "0 0 40px -8px hsl(var(--primary) / 0.2)",
        "inner-glow": "inset 0 1px 0 0 hsl(0 0% 100% / 0.05)",
        "dock": "0 4px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(239 84% 67% / 0.3)" },
          "50%": { boxShadow: "0 0 0 8px hsl(239 84% 67% / 0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        blurIn: {
          from: { opacity: "0", filter: "blur(8px)" },
          to: { opacity: "1", filter: "blur(0)" },
        },
        slideUpFade: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.5s infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        breathe: "breathe 4s ease-in-out infinite",
        blurIn: "blurIn 0.6s ease-out forwards",
        slideUpFade: "slideUpFade 0.5s ease-out forwards",
        "spin-slow": "spin-slow 20s linear infinite",
        marquee: "marquee 30s linear infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "aurora": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(168, 85, 247, 0.08), transparent), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(59, 130, 246, 0.08), transparent)",
      },
    },
  },
  plugins: [typography],
};

export default config;
