import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          900: "#0B3D2E",
          700: "#14532D",
          500: "#1E7A4F",
        },
        lime: {
          400: "#A3E635",
          300: "#BEF264",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter Tight", "Inter", "sans-serif"],
      },
      maxWidth: { content: "1280px" },
      borderRadius: { sm: "6px", md: "10px", lg: "16px" },
    },
  },
  plugins: [],
};
export default config;