import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Command-center dark palette.
        base: {
          950: "#070a12",
          900: "#0b0f1a",
          850: "#111726",
          800: "#161d2e",
          700: "#1f2a40",
          600: "#2b3a56",
        },
        accent: {
          DEFAULT: "#38bdf8",
          muted: "#0ea5e9",
        },
        warn: {
          DEFAULT: "#f59e0b",
          bg: "#3a2a08",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
