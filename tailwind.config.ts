import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const {nextui} = require("@nextui-org/react");

export default {
  content: [
    "./src/**/*.tsx",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors: {
        'msu-ai-background': '#151618' 
      }
    },
  },
  darkMode: "class",
  plugins: [nextui()],
} satisfies Config;
