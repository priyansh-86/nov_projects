// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  // Specify all file paths in the 'src' directory that contain Tailwind CSS class names
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // We use 'class' strategy for dark mode
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
