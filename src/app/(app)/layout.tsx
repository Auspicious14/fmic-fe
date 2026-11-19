import type { Viewport } from "next";

// The app itself stays a phone-width column, as before. The landing page at
// "/" sits outside this group so it can use the full screen width.
export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto relative overflow-hidden border-x border-border/50">
      {children}
    </main>
  );
}
