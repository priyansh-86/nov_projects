import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Killer Notes",
  description: "Minimal Glassmorphism Note Taking App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} relative overflow-hidden bg-black text-white`}>
        {/* Background Aurora Effect */}
        <div className="bg-aurora" />
        
        <div className="flex h-screen w-full">
          {/* Left Sidebar */}
          <Sidebar />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}