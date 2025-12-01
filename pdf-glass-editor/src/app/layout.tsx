import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast"; // 👈 Import kiya

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Glass PDF Editor",
  description: "Minimal. Secure. Serverless PDF Tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* 🟢 Toaster yahan lagaya (Global) */}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
            success: {
              iconTheme: {
                primary: '#4ade80',
                secondary: 'black',
              },
            },
          }}
        />
      </body>
    </html>
  );
}