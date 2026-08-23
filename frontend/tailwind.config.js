/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        4.5: "1.125rem",
        18: "4.5rem",
      },
      colors: {
        ink: {
          DEFAULT: "#0B1030",
          muted: "#4A5170",
          soft: "#6E7592",
        },
        brand: {
          50: "#EFF1FE",
          100: "#DDE2FD",
          200: "#BFC7FA",
          300: "#98A4F5",
          400: "#7480EC",
          500: "#5560DF",
          600: "#3F44C6",
          700: "#33369E",
          800: "#2A2C78",
          900: "#1E2058",
          950: "#0B1030",
        },
        accent: {
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F6F7FB",
          sunken: "#EEF0F8",
        },
        line: {
          DEFAULT: "#E4E7F2",
          strong: "#CFD4E6",
        },
        positive: {
          50: "#ECFDF3",
          600: "#15803D",
          700: "#166534",
        },
        danger: {
          50: "#FEF2F2",
          600: "#DC2626",
          700: "#B91C1C",
        },
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-lg": ["clamp(2.25rem, 5vw, 3.5rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(1.75rem, 3.5vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-sm": ["clamp(1.375rem, 2.5vw, 1.75rem)", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 16, 48, 0.04), 0 4px 16px -8px rgba(11, 16, 48, 0.12)",
        "card-hover": "0 2px 4px rgba(11, 16, 48, 0.06), 0 16px 32px -12px rgba(11, 16, 48, 0.18)",
        float: "0 8px 24px -6px rgba(63, 68, 198, 0.45)",
        pop: "0 12px 40px -8px rgba(11, 16, 48, 0.22)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      maxWidth: {
        content: "78rem",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "heart-pop": {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.28)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.2s ease-out both",
        "scale-in": "scale-in 0.18s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-up": "slide-up 0.24s cubic-bezier(0.22, 1, 0.36, 1) both",
        "heart-pop": "heart-pop 0.34s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
