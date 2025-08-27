import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asx: {
          cyan: "#19EFE4", // pulled from logo
          cyanDark: "#0DD6CC",
          black: "#000000",
          white: "#FFFFFF",
          slate: {
            900: "#0B0F14",
            800: "#0E141B",
            700: "#111A23"
          }
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(25, 239, 228, 0.25)",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
      borderRadius: {
        xl: "16px"
      }
    },
  },
  plugins: [],
};

export default config;
