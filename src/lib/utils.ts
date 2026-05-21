import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatReleaseDate(date: string, precision: string): string {
  if (precision === 'year') return date;
  if (precision === 'month') {
    const [year, month] = date.split('-');
    return format(new Date(Number(year), Number(month) - 1), 'MMM yyyy');
  }
  try {
    const parsed = parseISO(date);
    if (isValid(parsed)) return format(parsed, 'MMM d, yyyy');
  } catch { /* fallback */ }
  return date;
}

export function getReleaseTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    album: 'Album', single: 'Single', compilation: 'Compilation',
    appears_on: 'Appears On', ep: 'EP',
  };
  return labels[type] ?? type;
}

export function getReleaseTypeColor(type: string): string {
  const colors: Record<string, string> = {
    album:       'bg-brand/20 text-brand border-brand/30',
    single:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
    compilation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    appears_on:  'bg-orange-500/20 text-orange-400 border-orange-500/30',
    ep:          'bg-teal-500/20 text-teal-400 border-teal-500/30',
  };
  return colors[type] ?? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
}

export function parseDateForCalendar(date: string, precision: string): Date | null {
  if (precision === 'year') return null;
  try {
    if (precision === 'month') {
      const [year, month] = date.split('-');
      return new Date(Number(year), Number(month) - 1, 1);
    }
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  } catch { return null; }
}
