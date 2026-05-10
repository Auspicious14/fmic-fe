"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/shared/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center opacity-0", className)} />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "fcim-icon-btn",
        className
      )}
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="w-[18px] h-[18px] text-accent" />
      ) : (
        <Moon className="w-[18px] h-[18px] text-muted" />
      )}
    </button>
  );
}
