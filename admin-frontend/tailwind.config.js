/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deliberately different from the student marketplace's indigo/violet:
        // a staff console should never be mistaken for the public site.
        shell: {
          900: "#0C0A09",
          800: "#1C1917",
          700: "#292524",
          600: "#44403C",
        },
        ink: { DEFAULT: "#1C1917", muted: "#57534E", soft: "#78716C" },
        line: { DEFAULT: "#E7E5E4", strong: "#D6D3D1" },
        canvas: { DEFAULT: "#FFFFFF", muted: "#FAFAF9", sunken: "#F5F5F4" },
        // Amber signals elevated privilege, not danger.
        key: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        ok: { 50: "#F0FDF4", 100: "#DCFCE7", 600: "#16A34A", 700: "#15803D" },
        warn: { 50: "#FFF7ED", 600: "#EA580C", 700: "#C2410C" },
        bad: { 50: "#FEF2F2", 100: "#FEE2E2", 600: "#DC2626", 700: "#B91C1C" },
        info: { 50: "#EFF6FF", 100: "#DBEAFE", 600: "#2563EB", 700: "#1D4ED8" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(12,10,9,0.04), 0 2px 8px -4px rgba(12,10,9,0.10)",
        pop: "0 16px 48px -12px rgba(12,10,9,0.28)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": {
          from: { opacity: "0", transform: "translateY(6px) scale(0.985)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-in": "fade-in .18s ease-out both",
        "scale-in": "scale-in .16s cubic-bezier(.22,1,.36,1) both",
      },
    },
  },
  plugins: [],
};
