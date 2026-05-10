import { cn } from '@/shared/lib/utils';
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-surface rounded-[20px] p-6 border-[0.5px] border-border",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
