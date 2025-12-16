/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5", // Base (Indigo 600)
          700: "#4338ca", // Hover
          800: "#3730a3", // Active
          900: "#312e81",
          950: "#1e1b4b",
        },
        // Accent (Emerald for positive/success)
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // Base
          600: "#059669",
          700: "#047857",
        },
        // Neutrals (Slate for sophisticated grays)
        slate: {
          50: "#f8fafc", // Page BG
          100: "#f1f5f9",
          200: "#e2e8f0", // Borders
          300: "#cbd5e1",
          400: "#94a3b8", // Muted Text
          500: "#64748b",
          600: "#475569", // Secondary Text
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a", // Main Text
          950: "#020617",
        },
        // Semantics
        success: "#059669", // Emerald 600
        warning: "#f59e0b", // Amber 500
        error: "#dc2626", // Red 600
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.5rem", // 8px (Inputs/Buttons)
        xl: "0.75rem", // 12px (Cards)
        "2xl": "1rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
};
