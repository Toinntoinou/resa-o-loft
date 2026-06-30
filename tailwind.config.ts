import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f7f6",
          100: "#dcebe8",
          200: "#bad7d1",
          300: "#8fbcb3",
          400: "#5f9b90",
          500: "#418075",
          600: "#33675f",
          700: "#2b534d",
          800: "#264440",
          900: "#223a37",
          950: "#0f211f",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 33, 31, 0.04), 0 8px 24px rgba(16, 33, 31, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
