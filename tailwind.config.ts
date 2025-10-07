import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    borderRadius: {
      none: "0px",
      sm: "2px",
      DEFAULT: "4px",
      md: "4px",
      lg: "4px",
      xl: "6px",
      "2xl": "8px",
      "3xl": "12px",
      full: "9999px"
    },
    fontFamily: {
      sans: ["var(--font-ibm-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      display: ["var(--font-condensed)", "var(--font-ibm-sans)", "sans-serif"],
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
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900",
    },
    letterSpacing: {
      tighter: "-0.02em",
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
      sm: ["13px", { lineHeight: "1.45" }],
      base: ["15px", { lineHeight: "1.6" }],
      lg: ["17px", { lineHeight: "1.5" }],
      xl: ["18px", { lineHeight: "1.4" }],
      "2xl": ["22px", { lineHeight: "1.35" }],
      "3xl": ["24px", { lineHeight: "1.3" }],
      "4xl": ["28px", { lineHeight: "1.25" }],
      "5xl": ["34px", { lineHeight: "1.15" }],
      "6xl": ["40px", { lineHeight: "1.1" }],
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
