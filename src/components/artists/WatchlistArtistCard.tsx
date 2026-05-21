'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ExternalLink } from 'lucide-react';
import type { Artist } from '@/types';

interface WatchlistArtistCardProps {
  artist: Artist;
  onUntrack: (spotifyId: string) => Promise<void>;
}

export function WatchlistArtistCard({ artist, onUntrack }: WatchlistArtistCardProps) {
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    setLoading(true);
    await onUntrack(artist.spotify_id);
  }

  if (removing) return null;

  return (
    <div className="card flex items-center gap-3 p-3 hover:border-zinc-700 transition-all duration-200 group">
      {/* Avatar */}
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
        {artist.image_url ? (
          <Image
            src={artist.image_url}
            alt={artist.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-lg font-bold">
            {artist.name[0]}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm truncate">{artist.name}</p>
        {artist.genres.length > 0 && (
          <p className="text-zinc-500 text-xs truncate">{artist.genres.slice(0, 2).join(', ')}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {artist.spotify_url && (
          <a
            href={artist.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <ExternalLink size={13} />
          </a>
        )}
        <button
          onClick={handleRemove}
          disabled={loading}
          className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Remove from watchlist"
        >
          {loading ? (
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <X size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
