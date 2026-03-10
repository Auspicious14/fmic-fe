"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, History, Settings, BarChart2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Users, label: "Customers", href: "/customers" },
    { icon: BarChart2, label: "Summary", href: "/summary" },
    { icon: History, label: "History", href: "/history" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-100 flex items-center justify-around py-2 px-2 z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-all py-1 px-3 rounded-xl",
              isActive
                ? "text-slate-900"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <item.icon
              className={cn(
                "w-5 h-5 transition-all",
                isActive && "fill-slate-900/10",
              )}
            />
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-wider transition-all",
                isActive ? "text-slate-900" : "text-slate-400",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
