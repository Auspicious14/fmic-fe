import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}


function getInitials(name: string): string {
   return name
   .split(" ")
   .slice(0, 2)
   .map((w) => w[0]?.toUpperCase() ?? "")
   .join("");
}

export const AVATAR_PALETTES = [
  { bg: "#1F1A0A", color: "#F4A931" },
  { bg: "#1A0A0A", color: "#EF4444" },
  { bg: "#0A1A10", color: "#22C55E" },
  { bg: "#0A0F1A", color: "#3B82F6" },
  { bg: "#120A1A", color: "#A855F7" },
];

export function avatarPalette(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

export function formatNaira(amount: number): string {
  return amount.toLocaleString("en-NG");
}

export function todayLabel(): string {
  return new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}