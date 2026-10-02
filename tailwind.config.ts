import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5fc",
          100: "#d9e8f9",
          200: "#b9d6f4",
          300: "#89bdf0",
          400: "#529ce8",
          500: "#1a73e8", // Google-inspired primary blue
          600: "#1557b0",
          700: "#13468d",
          800: "#133a72",
          900: "#15335f",
          950: "#0e1f3b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-roboto-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
