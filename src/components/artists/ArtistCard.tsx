'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Check, ExternalLink, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpotifyArtist } from '@/types';

interface ArtistCardProps {
  artist: SpotifyArtist;
  isTracked: boolean;
  onTrack: (artist: SpotifyArtist) => Promise<void>;
  onUntrack: (spotifyId: string) => Promise<void>;
}

export function ArtistCard({ artist, isTracked, onTrack, onUntrack }: ArtistCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      isTracked ? await onUntrack(artist.id) : await onTrack(artist);
    } finally { setLoading(false); }
  }

  const image = artist.images[0]?.url;

  return (
    <div className="card-hover flex flex-col overflow-hidden group">
      <div className="relative aspect-square bg-zinc-800 overflow-hidden">
        {image ? (
          <Image src={image} alt={artist.name} fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-3xl font-bold">
            {artist.name[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      <div className="flex-1 p-3 flex flex-col gap-2">
        <div>
          <h3 className="font-semibold text-white text-sm leading-tight truncate">{artist.name}</h3>
          {artist.genres.length > 0 && (
            <p className="text-zinc-500 text-xs mt-0.5 truncate">{artist.genres.slice(0, 2).join(', ')}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><Zap size={11} />{artist.popularity}</span>
          <span className="flex items-center gap-1">
            <Users size={11} />
            {artist.followers.total >= 1_000_000
              ? `${(artist.followers.total / 1_000_000).toFixed(1)}M`
              : artist.followers.total >= 1000
              ? `${Math.round(artist.followers.total / 1000)}K`
              : artist.followers.total}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <button onClick={handleToggle} disabled={loading}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
              isTracked
                ? 'bg-brand/10 text-brand border border-brand/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                : 'bg-brand hover:bg-brand-hover text-black'
            )}>
            {loading ? (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isTracked ? <><Check size={12} /> Tracking</> : <><Plus size={12} /> Track</>}
          </button>
          <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer"
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
