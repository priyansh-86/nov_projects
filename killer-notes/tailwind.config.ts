import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",        // App folder scan karega
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Components folder scan karega (YE MISSING THA)
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",        // Lib folder bhi
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          100: "rgba(255, 255, 255, 0.1)",
          200: "rgba(255, 255, 255, 0.2)",
          border: "rgba(255, 255, 255, 0.1)",
        },
      },
      backgroundImage: {
        'aurora': 'radial-gradient(circle at 50% 0%, #3b0764 0%, #09090b 50%)',
      },
    },
  },
  plugins: [],
};
export default config;