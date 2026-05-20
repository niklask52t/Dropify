'use client';

import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, addMonths, subMonths, parseISO, startOfWeek, endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn, getReleaseTypeColor, getReleaseTypeLabel } from '@/lib/utils';
import type { Release, Artist } from '@/types';
import Image from 'next/image';

interface CalendarViewProps {
  releases: (Release & { artist?: Artist })[];
}

export function CalendarView({ releases }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const releasesByDay = useMemo(() => {
    const map = new Map<string, (Release & { artist?: Artist })[]>();
    for (const release of releases) {
      if (release.release_date_precision !== 'day') continue;
      try {
        const date = parseISO(release.release_date);
        const key = format(date, 'yyyy-MM-dd');
        const existing = map.get(key) ?? [];
        existing.push(release);
        map.set(key, existing);
      } catch {
        // invalid date
      }
    }
    return map;
  }, [releases]);

  const selectedReleases = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return releasesByDay.get(key) ?? [];
  }, [selectedDay, releasesByDay]);

  const today = new Date();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-white min-w-[160px] text-center">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setCurrentMonth(new Date())}
          className="ml-2 text-xs text-zinc-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors border border-zinc-800"
        >
          Today
        </button>
      </div>

      <div className="card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayReleases = releasesByDay.get(key) ?? [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const hasBorder = i % 7 !== 6;
            const hasBottomBorder = i < calendarDays.length - 7;

            return (
              <button
                key={key}
                onClick={() => {
                  if (dayReleases.length > 0) {
                    setSelectedDay(isSelected ? null : day);
                  }
                }}
                className={cn(
                  'relative p-1.5 sm:p-2 min-h-[64px] sm:min-h-[80px] text-left transition-colors',
                  hasBorder && 'border-r border-zinc-800',
                  hasBottomBorder && 'border-b border-zinc-800',
                  !isCurrentMonth && 'opacity-30',
                  dayReleases.length > 0 && 'cursor-pointer hover:bg-zinc-800/40',
                  isSelected && 'bg-brand/10',
                  !dayReleases.length && 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                    isToday ? 'bg-brand text-black font-bold' : 'text-zinc-300'
                  )}
                >
                  {format(day, 'd')}
                </span>

                {/* Release dots */}
                {dayReleases.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayReleases.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="text-[10px] leading-tight truncate text-zinc-300 bg-zinc-800/60 rounded px-1 py-0.5"
                      >
                        {r.title}
                      </div>
                    ))}
                    {dayReleases.length > 3 && (
                      <div className="text-[10px] text-zinc-500 px-1">
                        +{dayReleases.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay && selectedReleases.length > 0 && (
        <div className="card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">
              {format(selectedDay, 'MMMM d, yyyy')}
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {selectedReleases.length} release{selectedReleases.length > 1 ? 's' : ''}
              </span>
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X size={15} />
            </button>
          </div>
          <div className="space-y-2">
            {selectedReleases.map((release) => (
              <div key={release.id} className="flex items-center gap-3 p-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                  {release.cover_url ? (
                    <Image src={release.cover_url} alt={release.title} fill className="object-cover" sizes="48px" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{release.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{release.artist?.name}</p>
                  <span className={cn('badge text-[10px] mt-0.5', getReleaseTypeColor(release.type))}>
                    {getReleaseTypeLabel(release.type)}
                  </span>
                </div>
                {release.spotify_url && (
                  <a
                    href={release.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-brand hover:text-brand-hover transition-colors font-medium"
                  >
                    Open ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
