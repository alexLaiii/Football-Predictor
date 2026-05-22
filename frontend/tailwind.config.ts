import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wc: {
          navy:   "#0d0f1e",
          card:   "#13162b",
          border: "#1e2240",
          red:    "#f0294a",
          gold:   "#00c896",
          muted:  "#6b7a9e",
          blue:   "#1e2240",
        },
        claude:      "#7c3aed",
        gpt5:        "#16a34a",
        gemini:      "#2563eb",
        grok:        "#ea580c",
        sirkim:      "#ca8a04",
        deepseek:    "#0891b2",
      },
    },
  },
  plugins: [],
};

export default config;
