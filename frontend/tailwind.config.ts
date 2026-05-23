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
          navy:   "#ffffff",
          card:   "#ffffff",
          border: "#e5e7eb",
          red:    "#dc2626",
          gold:   "#059669",
          muted:  "#64748b",
          blue:   "#f1f5f9",
          ink:    "#0f172a",
          subtle: "#f8fafc",
        },
        claude:      "#7c3aed",
        gpt5:        "#16a34a",
        gemini:      "#2563eb",
        grok:        "#ea580c",
        sirkim:      "#ca8a04",
        deepseek:    "#0891b2",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
