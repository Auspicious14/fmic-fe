"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, History, Settings } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Users, label: 'Customers', href: '/customers' },
    { icon: History, label: 'History', href: '/history' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-md border-t border-slate-100 flex items-center justify-around py-3 px-4 z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors min-w-[64px]",
              isActive ? "text-slate-900" : "text-slate-400"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive && "fill-slate-900/10")} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
