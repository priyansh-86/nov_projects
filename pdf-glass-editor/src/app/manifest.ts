import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Glass PDF Editor",
    short_name: "GlassPDF",
    description: "Minimal. Secure. Serverless PDF Editor.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/logo.png", // 👈 PWA Logo path
        sizes: "512x512", 
        type: "image/png",
      },
    ],
  };
}