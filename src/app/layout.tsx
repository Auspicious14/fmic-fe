import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import QueryProvider from "@/shared/lib/query-provider";
import { ThemeProvider } from "@/shared/lib/theme-provider";
import { cn } from "@/shared/lib/utils";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const dm_sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "Ledga | Your debt book, in your voice",
  description:
    "Record credit sales with a voice note in Pidgin, Yoruba or English. Ledga keeps your debt book and sends your customer a receipt.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ledga",
  },
};

export const viewport: Viewport = {
  themeColor: "#13202E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          syne.variable,
          dm_sans.variable,
          syne.className,
          dm_sans.className,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryProvider>
            {children}
            <Toaster position="top-center" richColors />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
