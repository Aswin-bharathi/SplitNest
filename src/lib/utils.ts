import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Member } from './types';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

export const compactCurrency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 1,
  notation: 'compact'
});

export const memberName = (members: Member[], id: string) => members.find((member) => member.id === id)?.name ?? 'Unknown';

export const initialsColor = (id: string) => {
  const colors = ['bg-primary', 'bg-secondary', 'bg-success', 'bg-cyan-500', 'bg-amber-500'];
  return colors[Math.abs(id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % colors.length];
};
