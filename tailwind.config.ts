import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    borderRadius: {
      none: "0px",
      sm: "3px",
      DEFAULT: "5px",
      md: "5px",
      lg: "5px",
      xl: "5px",
      "2xl": "5px",
      "3xl": "5px",
      full: "9999px"
    },
    fontFamily: {
      sans: ["var(--font-inter)"],
      mono: [
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        "Liberation Mono",
        "Courier New",
        "monospace",
      ],
    },
    fontWeight: {
      thin: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "550",
      bold: "650",
      extrabold: "800",
      black: "900",
    },
    letterSpacing: {
      tighter: "-0.015em",
      tight: "-0.01em",
      normal: "0",
      wide: "0.02em",
      wider: "0.04em",
      widest: "0.08em",
    },
    fontSize: {
      "5xs": ["8px", { lineHeight: "1.15" }],
      "4xs": ["9px", { lineHeight: "1.15" }],
      "3xs": ["10px", { lineHeight: "1.2" }],
      "2xs": ["11px", { lineHeight: "1.25" }],
      xs: ["12px", { lineHeight: "1.35" }],
      sm: ["14px", { lineHeight: "1.4" }],
      base: ["16px", { lineHeight: "1.6" }],
      lg: ["18px", { lineHeight: "1.45" }],
      xl: ["20px", { lineHeight: "1.35" }],
      "2xl": ["24px", { lineHeight: "1.3" }],
      "3xl": ["28px", { lineHeight: "1.25" }],
      "4xl": ["32px", { lineHeight: "1.2" }],
      "5xl": ["40px", { lineHeight: "1.1" }],
      "6xl": ["48px", { lineHeight: "1.05" }],
    },
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
    },
  },
  plugins: [],
};

export default config;
