import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Movie Explorer - TMDb Serverless Project",
  description: "A beautiful, secure movie search application built with Next.js, Tailwind CSS, and Vercel Serverless Functions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-primary-dark text-text-light`}>
        {children}
      </body>
    </html>
  );
}
