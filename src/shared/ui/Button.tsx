import { cn } from '@/shared/lib/utils';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'confirm';
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
    primary: 'bg-accent text-background hover:opacity-90 active:scale-95',
    secondary: 'bg-elevated text-foreground border-[0.5px] border-border hover:border-muted active:scale-95',
    outline: 'bg-transparent text-foreground border-[0.5px] border-border hover:bg-surface active:scale-95',
    ghost: 'bg-transparent text-muted hover:text-foreground active:scale-95',
    danger: 'bg-danger/10 text-danger border-[0.5px] border-danger/20 hover:bg-danger/20 active:scale-95',
    confirm: 'bg-success text-background hover:opacity-90 active:scale-95',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-xl',
    md: 'px-4 py-2.5 rounded-[14px]',
    lg: 'px-6 py-3.5 text-lg font-medium rounded-[14px]',
    xl: 'px-8 py-5 text-xl font-semibold rounded-[18px]',
  };

  const spinnerColor = (variant === 'primary' || variant === 'confirm') ? 'border-t-[#0A0A0A]' : 'border-t-white';

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none font-sans font-bold",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className={cn("w-5 h-5 border-2 border-white/30 rounded-full animate-spin mr-2", spinnerColor)} />
      ) : null}
      {children}
    </button>
  );
}
