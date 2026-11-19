import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        workspace: "hsl(var(--workspace))",
        brand: {
          50: "#f3f0ff", 100: "#e9e3ff", 200: "#d4caff", 300: "#b5a3ff", 400: "#9270ff",
          500: "#7444ff", 600: "#6328f5", 700: "#531ad9", 800: "#4517b0", 900: "#3a168f",
        },
        coral: { 400: "#ff8a7a", 500: "#ff6b5a" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)", xl: "calc(var(--radius) + 4px)", "2xl": "calc(var(--radius) + 8px)" },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,12,40,.04), 0 4px 16px rgba(16,12,40,.06)",
        lift: "0 2px 4px rgba(16,12,40,.05), 0 12px 32px rgba(16,12,40,.10)",
        glow: "0 0 0 1px rgba(116,68,255,.25), 0 8px 24px rgba(116,68,255,.25)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7444ff 0%, #b14dff 50%, #ff6b5a 100%)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { shimmer: "shimmer 1.5s infinite" },
    },
  },
  plugins: [animate],
};
export default config;
