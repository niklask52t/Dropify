'use client';

import { useState, useMemo } from 'react';
import { ReleaseCard } from './ReleaseCard';
import { ReleaseFilters } from './ReleaseFilters';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Release, Artist, ReleaseFilters as Filters } from '@/types';
import { Disc3, Music2 } from 'lucide-react';
import Link from 'next/link';

interface ReleaseFeedProps {
  releases: (Release & { artist?: Artist })[];
  trackedArtists: Artist[];
  totalTracked: number;
}

export function ReleaseFeed({ releases, trackedArtists, totalTracked }: ReleaseFeedProps) {
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const filtered = useMemo(() => {
    return releases.filter((r) => {
      if (filters.artistId && r.artist_spotify_id !== filters.artistId) return false;
      if (filters.type && r.type !== filters.type) return false;
      if (filters.dateFrom && r.release_date < filters.dateFrom) return false;
      if (filters.dateTo && r.release_date > filters.dateTo) return false;
      if (filters.search && !r.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [releases, filters]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  function handleFilterChange(newFilters: Filters) {
    setFilters(newFilters);
    setPage(1);
  }

  if (totalTracked === 0) {
    return (
      <EmptyState
        icon={<Music2 size={40} />}
        title="No artists tracked"
        description="Go to the Artists page to search and track artists. Releases will appear here automatically."
        action={
          <Link href="/artists" className="btn-primary">
            Browse Artists
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <ReleaseFilters filters={filters} onChange={handleFilterChange} trackedArtists={trackedArtists} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Disc3 size={36} />}
          title="No releases found"
          description={
            Object.values(filters).some(Boolean)
              ? "No releases match your current filters. Try adjusting or clearing them."
              : "No releases synced yet. Click Sync in the top bar or wait for the daily sync."
          }
          action={
            Object.values(filters).some(Boolean) ? (
              <button onClick={() => setFilters({})} className="btn-secondary">
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-zinc-500 text-xs">
            Showing {paginated.length} of {filtered.length} releases
          </p>
          <div className="space-y-2">
            {paginated.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
