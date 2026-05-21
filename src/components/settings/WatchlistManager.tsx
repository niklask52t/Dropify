'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Music2, ExternalLink } from 'lucide-react';
import type { Artist } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

interface WatchlistEntry { trackId: string; artist: Artist }

export function WatchlistManager({ watchlist: initial }: { watchlist: WatchlistEntry[] }) {
  const [watchlist, setWatchlist] = useState(initial);
  const [removing, setRemoving]   = useState(new Set<string>());

  async function handleRemove(spotifyId: string) {
    setRemoving((s) => new Set([...s, spotifyId]));
    await fetch(`/api/artists/track?spotifyId=${spotifyId}`, { method: 'DELETE' });
    setWatchlist((w) => w.filter((e) => e.artist.spotifyId !== spotifyId));
    setRemoving((s) => { const n = new Set(s); n.delete(spotifyId); return n; });
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Music2 size={16} className="text-zinc-400" />
        <h2 className="font-semibold text-white">
          Tracked Artists
          {watchlist.length > 0 && (
            <span className="ml-2 text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
              {watchlist.length}
            </span>
          )}
        </h2>
      </div>

      {watchlist.length === 0 ? (
        <EmptyState icon={<Music2 size={28} />} title="No artists tracked"
          description="Add artists from the Artists page."
          action={<Link href="/artists" className="btn-secondary text-xs">Browse Artists</Link>}
          className="py-8" />
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {watchlist.map(({ trackId, artist }) => (
            <div key={trackId} className="flex items-center gap-3 p-2 hover:bg-zinc-800/40 rounded-lg group transition-colors">
              <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                {artist.imageUrl ? (
                  <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" sizes="36px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm font-bold">
                    {artist.name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{artist.name}</p>
                {artist.genres.length > 0 && (
                  <p className="text-xs text-zinc-500 truncate">{artist.genres.slice(0, 2).join(', ')}</p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {artist.spotifyUrl && (
                  <a href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors">
                    <ExternalLink size={12} />
                  </a>
                )}
                <button onClick={() => handleRemove(artist.spotifyId)}
                  disabled={removing.has(artist.spotifyId)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
