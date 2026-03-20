import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import QueryProvider from '@/shared/lib/query-provider';
import { cn } from "@/shared/lib/utils";

const syne = Syne({ subsets: ['latin']});
const dm_sans = DM_Sans({subsets: ['latin']});

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
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { ThemeProvider } from '@/shared/lib/theme-provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(syne.className, dm_sans.className)}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryProvider>
            <main className="min-h-screen bg-background text-foreground max-w-md mx-auto relative overflow-hidden border-x border-border/50">
              {children}
              <Toaster position="top-center" richColors />
            </main>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
