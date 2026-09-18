import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // "Ledger book" direction: warm paper, dense ink, book-keeping colours.
      colors: {
        paper: {
          DEFAULT: "#F2EEE5", // page background
          card: "#FCFAF6", // card surface
          sunk: "#E9E3D6", // recessed areas and table headers
        },
        ink: {
          DEFAULT: "#1C1B18", // primary text
          soft: "#4A463E", // secondary text
          faint: "#6B665C", // tertiary text, still ≥4.5:1 on paper
        },
        rule: {
          DEFAULT: "#DDD6C7", // dividers
          strong: "#C6BCA6",
        },
        ledger: {
          DEFAULT: "#1B5E4A", // incoming funds
          soft: "#E4EDE8",
        },
        oxide: {
          DEFAULT: "#A0402C", // outgoing funds
          soft: "#F4E6E1",
        },
        brass: {
          DEFAULT: "#B08430", // meter fill, never text
          ink: "#7E5C1C", // text-safe brass
          soft: "#F0E7D3",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        // Ledger paper has crisp corners, not pills.
        card: "4px",
        control: "3px",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(28,27,24,0.04), 0 1px 3px 0 rgba(28,27,24,0.05)",
        raised: "0 2px 8px -2px rgba(28,27,24,0.12)",
      },
      backgroundImage: {
        // Diagonal hatch marking funds that have not been spent yet.
        hatch:
          "repeating-linear-gradient(-45deg, #DDD6C7 0 1px, transparent 1px 7px)",
      },
    },
  },
  plugins: [],
};

export default config;
