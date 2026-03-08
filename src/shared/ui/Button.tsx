import { cn } from '@/shared/lib/utils';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className, 
  disabled,
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-95',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95',
    ghost: 'text-slate-600 hover:bg-slate-50 active:scale-95',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 active:scale-95',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3.5 text-lg font-medium',
    xl: 'px-8 py-5 text-xl font-semibold rounded-2xl',
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
}
