'use client';

import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isSameMonth, addMonths, subMonths, parseISO, startOfWeek, endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn, getReleaseTypeColor, getReleaseTypeLabel } from '@/lib/utils';
import type { Release, Artist } from '@/types';
import Image from 'next/image';

interface CalendarViewProps {
  releases: (Release & { artist?: Artist })[];
}

export function CalendarView({ releases }: CalendarViewProps) {
  const [current, setCurrent]       = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 });
    const end   = endOfWeek(endOfMonth(current),     { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [current]);

  const byDay = useMemo(() => {
    const map = new Map<string, (Release & { artist?: Artist })[]>();
    for (const r of releases) {
      if (r.releaseDatePrecision !== 'day') continue;
      try {
        const key = format(parseISO(r.releaseDate), 'yyyy-MM-dd');
        map.set(key, [...(map.get(key) ?? []), r]);
      } catch { /* skip */ }
    }
    return map;
  }, [releases]);

  const selectedReleases = useMemo(() => {
    if (!selectedDay) return [];
    return byDay.get(format(selectedDay, 'yyyy-MM-dd')) ?? [];
  }, [selectedDay, byDay]);

  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={() => setCurrent((m) => subMonths(m, 1))}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-white min-w-[160px] text-center">
          {format(current, 'MMMM yyyy')}
        </h2>
        <button onClick={() => setCurrent((m) => addMonths(m, 1))}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
          <ChevronRight size={18} />
        </button>
        <button onClick={() => setCurrent(new Date())}
          className="ml-2 text-xs text-zinc-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors border border-zinc-800">
          Today
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key      = format(day, 'yyyy-MM-dd');
            const dayRels  = byDay.get(key) ?? [];
            const inMonth  = isSameMonth(day, current);
            const isToday  = isSameDay(day, today);
            const isSel    = selectedDay ? isSameDay(day, selectedDay) : false;

            return (
              <button key={key}
                onClick={() => dayRels.length && setSelectedDay(isSel ? null : day)}
                className={cn(
                  'relative p-1.5 sm:p-2 min-h-[64px] sm:min-h-[80px] text-left transition-colors',
                  i % 7 !== 6    && 'border-r border-zinc-800',
                  i < days.length - 7 && 'border-b border-zinc-800',
                  !inMonth && 'opacity-30',
                  dayRels.length ? 'cursor-pointer hover:bg-zinc-800/40' : 'cursor-default',
                  isSel && 'bg-brand/10',
                )}>
                <span className={cn('inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                  isToday ? 'bg-brand text-black font-bold' : 'text-zinc-300')}>
                  {format(day, 'd')}
                </span>
                {dayRels.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayRels.slice(0, 3).map((r) => (
                      <div key={r.id} className="text-[10px] leading-tight truncate text-zinc-300 bg-zinc-800/60 rounded px-1 py-0.5">
                        {r.title}
                      </div>
                    ))}
                    {dayRels.length > 3 && (
                      <div className="text-[10px] text-zinc-500 px-1">+{dayRels.length - 3} more</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && selectedReleases.length > 0 && (
        <div className="card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">
              {format(selectedDay, 'MMMM d, yyyy')}
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {selectedReleases.length} release{selectedReleases.length > 1 ? 's' : ''}
              </span>
            </h3>
            <button onClick={() => setSelectedDay(null)}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <X size={15} />
            </button>
          </div>
          <div className="space-y-2">
            {selectedReleases.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                  {r.coverUrl && <Image src={r.coverUrl} alt={r.title} fill className="object-cover" sizes="48px" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{r.artist?.name}</p>
                  <span className={cn('badge text-[10px] mt-0.5', getReleaseTypeColor(r.type))}>
                    {getReleaseTypeLabel(r.type)}
                  </span>
                </div>
                {r.spotifyUrl && (
                  <a href={r.spotifyUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-brand hover:text-brand-hover font-medium shrink-0">Open ↗</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
