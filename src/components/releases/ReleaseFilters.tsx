'use client';

import { X } from 'lucide-react';
import type { Artist } from '@/types';
import type { ReleaseFilters } from '@/types';

interface ReleaseFiltersProps {
  filters: ReleaseFilters;
  onChange: (filters: ReleaseFilters) => void;
  trackedArtists: Artist[];
}

const RELEASE_TYPES = [
  { value: '', label: 'All types' },
  { value: 'album', label: 'Albums' },
  { value: 'single', label: 'Singles' },
  { value: 'compilation', label: 'Compilations' },
  { value: 'appears_on', label: 'Appears On' },
];

const DATE_RANGES = [
  { value: '', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

function getDateFrom(range: string): string {
  if (!range) return '';
  const now = new Date();
  const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  now.setDate(now.getDate() - (days[range] ?? 0));
  return now.toISOString().split('T')[0];
}

export function ReleaseFilters({ filters, onChange, trackedArtists }: ReleaseFiltersProps) {
  const hasActiveFilters = filters.artistId || filters.type || filters.dateFrom || filters.search;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <input
          type="text"
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          placeholder="Search releases..."
          className="input max-w-[200px]"
        />

        {/* Artist filter */}
        <select
          value={filters.artistId ?? ''}
          onChange={(e) => onChange({ ...filters, artistId: e.target.value || undefined })}
          className="input max-w-[180px] cursor-pointer"
        >
          <option value="">All artists</option>
          {trackedArtists.map((a) => (
            <option key={a.spotify_id} value={a.spotify_id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filters.type ?? ''}
          onChange={(e) => onChange({ ...filters, type: e.target.value || undefined })}
          className="input max-w-[150px] cursor-pointer"
        >
          {RELEASE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Date range */}
        <select
          value={filters.dateFrom ? (() => {
            const d = new Date(filters.dateFrom);
            const now = new Date();
            const diffDays = Math.ceil((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) return '7d';
            if (diffDays <= 30) return '30d';
            if (diffDays <= 90) return '90d';
            return '1y';
          })() : ''}
          onChange={(e) => onChange({ ...filters, dateFrom: getDateFrom(e.target.value) || undefined })}
          className="input max-w-[140px] cursor-pointer"
        >
          {DATE_RANGES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={() => onChange({})}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
