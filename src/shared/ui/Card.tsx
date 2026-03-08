import { cn } from '@/shared/lib/utils';
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-2xl p-6 shadow-sm border border-slate-100",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
