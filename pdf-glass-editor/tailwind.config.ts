import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // Ye line sabse important hai - ye src ke andar har file ko scan karegi
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    
    // Safety ke liye root paths bhi add kar dete hain
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
      },
      colors: {
        glass: {
          border: "rgba(255, 255, 255, 0.1)",
          text: "rgba(255, 255, 255, 0.7)",
          highlight: "rgba(255, 255, 255, 0.15)",
        },
      },
    },
  },
  plugins: [],
};
export default config;