import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1B4FD8",
          blue: "#1B4FD8",
          navy: "#0F2A5E",
          sky: "#3B82F6",
          light: "#EEF2FF",
        },
        surface: {
          DEFAULT: "#f8fafc",
          card: "#ffffff",
          muted: "#f1f5f9",
          hover: "#f0f1f4",
        },
        ink: {
          DEFAULT: "#0f172a",
          secondary: "#475569",
          tertiary: "#94a3b8",
          faint: "#cbd5e1",
        },
        seg: {
          newFirst: "#10b981",
          newDomToIntl: "#047857",
          returning: "#2563eb",
          resurrecting: "#d97706",
        },
        style: {
          daily: "#7c3aed",
          swing: "#0284c7",
          occasional: "#78818f",
        },
      },
      borderColor: {
        DEFAULT: "#e2e8f0",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
