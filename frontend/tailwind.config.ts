import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zoom: {
          blue: "#0B5CFF",
          "blue-hover": "#0845BF",
          "blue-active": "#0636A1",
          orange: "#FF742E",
          "orange-hover": "#E56324",
          "text-primary": "#232333",
          "text-secondary": "#747487",
          border: "#E4E4E8",
          bg: "#FFFFFF",
          surface: "#F7F9FA",
          "active-tint": "#E8F1FF",
          danger: "#E02828",
          "danger-hover": "#C02020",
          live: "#2EB67D",
          "dark-bg": "#1C1C1C",
          "dark-tile": "#2D2D2D",
          "dark-bar": "#1F1F1F",
          "dark-surface": "#262626",
          "dark-border": "#383838",
        },
      },
      fontFamily: {
        sans: ["Lato", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        btn: "6px",
        tile: "16px",
        modal: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.05)",
        modal: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
        250: "250ms",
      },
    },
  },
  plugins: [],
};

export default config;
