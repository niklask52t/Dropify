'use client';

import { useState, useCallback } from 'react';
import { ArtistSearch } from './ArtistSearch';
import { ArtistCard } from './ArtistCard';
import { WatchlistArtistCard } from './WatchlistArtistCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SpotifyArtist, Artist } from '@/types';
import { Music2 } from 'lucide-react';

interface WatchlistEntry { trackId: string; artist: Artist }

interface ArtistsClientProps {
  watchlist: WatchlistEntry[];
  trackedSpotifyIds: string[];
}

export function ArtistsClient({ watchlist: initial, trackedSpotifyIds: initialIds }: ArtistsClientProps) {
  const [watchlist, setWatchlist]   = useState(initial);
  const [trackedIds, setTrackedIds] = useState(new Set(initialIds));
  const [results, setResults]       = useState<SpotifyArtist[]>([]);
  const [searching, setSearching]   = useState(false);

  const handleTrack = useCallback(async (artist: SpotifyArtist) => {
    const res = await fetch('/api/artists/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spotifyId: artist.id,
        name: artist.name,
        imageUrl: artist.images[0]?.url,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers.total,
        spotifyUrl: artist.external_urls.spotify,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setTrackedIds((prev) => new Set([...Array.from(prev), artist.id]));
      if (data.artist) {
        setWatchlist((prev) => [
          { trackId: data.artist.id, artist: data.artist },
          ...prev.filter((w) => w.artist.spotifyId !== artist.id),
        ]);
      }
    }
  }, []);

  const handleUntrack = useCallback(async (spotifyId: string) => {
    await fetch(`/api/artists/track?spotifyId=${spotifyId}`, { method: 'DELETE' });
    setTrackedIds((prev) => { const n = new Set(prev); n.delete(spotifyId); return n; });
    setWatchlist((prev) => prev.filter((w) => w.artist.spotifyId !== spotifyId));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Search Artists</h2>
        <ArtistSearch onResults={setResults} onSearchingChange={setSearching} />
        {searching && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        )}
        {!searching && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {results.map((artist) => (
              <ArtistCard key={artist.id} artist={artist}
                isTracked={trackedIds.has(artist.id)}
                onTrack={handleTrack} onUntrack={handleUntrack} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-white mb-4">
          Your Watchlist
          {watchlist.length > 0 && (
            <span className="ml-2 text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
              {watchlist.length}
            </span>
          )}
        </h2>
        {watchlist.length === 0 ? (
          <EmptyState icon={<Music2 size={40} />} title="No artists tracked yet"
            description="Search for artists above and click Track to add them to your watchlist." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {watchlist.map(({ trackId, artist }) => (
              <WatchlistArtistCard key={trackId} artist={artist} onUntrack={handleUntrack} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
