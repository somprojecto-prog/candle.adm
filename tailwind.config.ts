import type { Config } from "tailwindcss";

// Mesma paleta do site da loja (lib/constants.ts do projeto principal).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0B",
        ink2: "#111111",
        gold: { DEFAULT: "#C9A962", dim: "#8A7440", light: "#D9BC7C" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
