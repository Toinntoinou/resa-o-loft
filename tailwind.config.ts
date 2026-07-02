import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette Naama (charte Murex 2026). "brand" = échelle de verts,
        // reprise par tous les composants existants.
        brand: {
          50: "#f2f6f4",
          100: "#e4ece8", // brume verte pâle
          200: "#cdddd5",
          300: "#a9c3b8", // sage doux
          400: "#92aca0", // sage (couleur du logo)
          500: "#6e8778", // vert forêt (principal)
          600: "#5c7364", // forêt foncé (boutons)
          700: "#495c50",
          800: "#39493f",
          900: "#253728", // vert nuit
          950: "#16211a",
        },
        naama: {
          mint: "#bcd0c8",
          brume: "#ecf2ee",
          sage: "#92aca0",
          sageSoft: "#a9c3b8",
          sageLight: "#8bad9f",
          forest: "#6e8778",
          night: "#253728",
        },
        // Turquoise — réservé aux titres (accent rare).
        turquoise: {
          DEFAULT: "#00b2c3",
          600: "#0098a7",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-barlow)",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
        display: [
          "var(--font-barlow-condensed)",
          "var(--font-barlow)",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(37, 55, 40, 0.04), 0 10px 30px rgba(37, 55, 40, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
