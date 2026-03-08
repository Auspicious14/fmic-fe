import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import QueryProvider from '@/shared/lib/query-provider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FMIC | Financial Memory",
  description: "Financial Memory Layer for Informal Commerce",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FMIC",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <main className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto relative shadow-xl overflow-hidden">
            {children}
            <Toaster position="top-center" richColors />
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
