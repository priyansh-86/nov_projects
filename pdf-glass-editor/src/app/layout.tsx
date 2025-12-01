import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Glass PDF Editor",
  description: "Minimal. Secure. Serverless PDF Tools.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png", // 👈 Yahan tumhara logo lag gaya
    apple: "/logo.png", // Apple devices ke liye bhi same
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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