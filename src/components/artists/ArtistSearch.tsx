'use client';

import { useState, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import type { SpotifyArtist } from '@/types';

interface ArtistSearchProps {
  onResults: (artists: SpotifyArtist[]) => void;
  onSearchingChange: (searching: boolean) => void;
}

export function ArtistSearch({ onResults, onSearchingChange }: ArtistSearchProps) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        onResults([]);
        onSearchingChange(false);
        return;
      }

      onSearchingChange(true);
      try {
        const res = await fetch(`/api/artists/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        onResults(data.artists ?? []);
      } catch {
        onResults([]);
      } finally {
        onSearchingChange(false);
      }
    },
    [onResults, onSearchingChange]
  );

  function handleChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (!value.trim()) {
      onResults([]);
      onSearchingChange(false);
      return;
    }
    onSearchingChange(true);
    debounceRef.current = setTimeout(() => search(value), 350);
  }

  function handleClear() {
    setQuery('');
    onResults([]);
    onSearchingChange(false);
  }

  return (
    <div className="relative max-w-lg">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search for artists..."
        className="input pl-9 pr-9"
        autoComplete="off"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
