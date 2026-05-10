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
    <nav className="fcim-bottom-nav">
      <div className="fcim-nav-bar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("fcim-nav-item", isActive && "active")}
            >
              <item.icon
                className={cn("w-5 h-5 transition-all", isActive ? "text-accent" : "text-muted")}
              />
              <span className="transition-all">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
